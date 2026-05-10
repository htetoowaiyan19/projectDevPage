import {
  collection,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import {
  DEFAULT_ROLE_SLOTS,
  normalizeRoleSlots,
  SETUP_META_DOC_ID,
  SETUP_SYSTEM_COLLECTION,
} from '../utils/setupPhase'

const MEMBER_COLLECTION = 'members'

function mapMemberSnapshot(memberDoc) {
  const data = memberDoc.data()

  return {
    id: memberDoc.id,
    name: data.Name ?? '',
    rollNumber: data.RollNumber ?? '',
    votePoint: Number(data.VotePoint ?? 1),
    isAdmin: Boolean(data.IsAdmin),
    isLeader: Boolean(data.IsLeader),
    role: data.Role ?? '',
    hasProject: Boolean(data.HasProject),
    hasVoted: Boolean(data.HasVoted),
  }
}

function sortMembers(left, right) {
  if (left.isLeader !== right.isLeader) {
    return Number(right.isLeader) - Number(left.isLeader)
  }

  return left.name.localeCompare(right.name)
}

function getSetupMetaSnapshotData(snapshot) {
  if (!snapshot.exists()) {
    return {
      roleSlots: { ...DEFAULT_ROLE_SLOTS },
    }
  }

  const data = snapshot.data()

  return {
    roleSlots: normalizeRoleSlots(data.RoleSlots),
  }
}

export function subscribeToMembers(onMembers, onError) {
  return onSnapshot(
    collection(db, MEMBER_COLLECTION),
    (snapshot) => {
      const members = snapshot.docs
        .filter((memberDoc) => memberDoc.id !== SETUP_META_DOC_ID)
        .map(mapMemberSnapshot)
        .sort(sortMembers)

      onMembers(members)
    },
    onError,
  )
}

export function subscribeToSetupMeta(onMeta, onError) {
  return onSnapshot(
    doc(db, SETUP_SYSTEM_COLLECTION, SETUP_META_DOC_ID),
    (snapshot) => {
      onMeta(getSetupMetaSnapshotData(snapshot))
    },
    onError,
  )
}

export async function claimRole({ memberId, role }) {
  if (!Object.hasOwn(DEFAULT_ROLE_SLOTS, role)) {
    throw new Error('That role is not available.')
  }

  return runTransaction(db, async (transaction) => {
    const memberRef = doc(db, MEMBER_COLLECTION, memberId)
    const metaRef = doc(db, SETUP_SYSTEM_COLLECTION, SETUP_META_DOC_ID)

    const [memberSnapshot, metaSnapshot] = await Promise.all([
      transaction.get(memberRef),
      transaction.get(metaRef),
    ])

    if (!memberSnapshot.exists()) {
      throw new Error('Member record not found.')
    }

    const memberData = memberSnapshot.data()
    const currentRole = String(memberData.Role ?? '').trim()

    if (currentRole && currentRole !== role) {
      throw new Error('You have already locked in a role for Setup.')
    }

    if (currentRole === role) {
      return {
        role,
        remainingSlots: normalizeRoleSlots(metaSnapshot.data()?.RoleSlots)[role],
      }
    }

    const nextRoleSlots = normalizeRoleSlots(metaSnapshot.data()?.RoleSlots)

    if (nextRoleSlots[role] <= 0) {
      throw new Error(`${role} is already full.`)
    }

    nextRoleSlots[role] -= 1

    transaction.update(memberRef, {
      Role: role,
      UpdatedAt: serverTimestamp(),
    })

    transaction.set(
      metaRef,
      {
        RoleSlots: nextRoleSlots,
        UpdatedAt: serverTimestamp(),
      },
      { merge: true },
    )

    return {
      role,
      remainingSlots: nextRoleSlots[role],
    }
  })
}
