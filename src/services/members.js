import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import {
  DEFAULT_ROLE_SLOTS,
  getManagerVoteDeadlineMs,
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
    isManager: Boolean(data.IsManager),
    role: data.Role ?? '',
    hasProject: Boolean(data.HasProject),
    hasVoted: Boolean(data.HasVoted),
    hasManagerVoted: Boolean(data.HasManagerVoted),
    votedManagerId: data.VotedManagerId ?? '',
    managerVoteCount: Number(data.ManagerVoteCount ?? 0),
  }
}

function sortMembers(left, right) {
  if (left.isLeader !== right.isLeader) {
    return Number(right.isLeader) - Number(left.isLeader)
  }

  if (left.isManager !== right.isManager) {
    return Number(right.isManager) - Number(left.isManager)
  }

  return left.name.localeCompare(right.name)
}

function getSetupMetaSnapshotData(snapshot) {
  if (!snapshot.exists()) {
    return {
      roleSlots: { ...DEFAULT_ROLE_SLOTS },
      managerWinnerId: '',
      managerWinnerName: '',
      isManagerVoteFinalized: false,
    }
  }

  const data = snapshot.data()

  return {
    roleSlots: normalizeRoleSlots(data.RoleSlots),
    managerWinnerId: data.ManagerWinnerId ?? '',
    managerWinnerName: data.ManagerWinnerName ?? '',
    isManagerVoteFinalized: Boolean(data.IsManagerVoteFinalized),
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

export async function castManagerVote({ memberId, candidateId }) {
  return runTransaction(db, async (transaction) => {
    const voterRef = doc(db, MEMBER_COLLECTION, memberId)
    const candidateRef = doc(db, MEMBER_COLLECTION, candidateId)

    const [voterSnapshot, candidateSnapshot] = await Promise.all([
      transaction.get(voterRef),
      transaction.get(candidateRef),
    ])

    if (Date.now() >= getManagerVoteDeadlineMs()) {
      throw new Error('Fund manager voting closed on 13 May 2026.')
    }

    if (!voterSnapshot.exists() || !candidateSnapshot.exists()) {
      throw new Error('Member record not found.')
    }

    const voterData = voterSnapshot.data()
    const candidateData = candidateSnapshot.data()

    if (memberId === candidateId) {
      throw new Error('You cannot vote for yourself as fund manager.')
    }

    if (voterData.HasManagerVoted) {
      throw new Error('You have already voted for the fund manager.')
    }

    if (candidateData.IsLeader) {
      throw new Error('The project leader cannot be selected as fund manager.')
    }

    transaction.update(candidateRef, {
      ManagerVoteCount: Number(candidateData.ManagerVoteCount ?? 0) + 1,
      UpdatedAt: serverTimestamp(),
    })

    transaction.update(voterRef, {
      HasManagerVoted: true,
      VotedManagerId: candidateId,
      UpdatedAt: serverTimestamp(),
    })

    return {
      candidateName: candidateData.Name ?? 'Selected member',
    }
  })
}

export async function finalizeManagerVoteIfNeeded() {
  const membersSnapshot = await getDocs(collection(db, MEMBER_COLLECTION))
  const members = membersSnapshot.docs
    .filter((memberDoc) => memberDoc.id !== SETUP_META_DOC_ID)
    .map((memberDoc) => ({ id: memberDoc.id, ...memberDoc.data() }))

  const eligibleCandidates = members
    .filter((member) => !member.IsLeader)
    .sort((left, right) => {
      const voteGap = Number(right.ManagerVoteCount ?? 0) - Number(left.ManagerVoteCount ?? 0)

      if (voteGap !== 0) {
        return voteGap
      }

      return String(left.Name ?? '').localeCompare(String(right.Name ?? ''))
    })

  const winner = eligibleCandidates[0] ?? null
  const currentManagers = members.filter((member) => member.IsManager)
  const metaRef = doc(db, SETUP_SYSTEM_COLLECTION, SETUP_META_DOC_ID)

  return runTransaction(db, async (transaction) => {
    const metaSnapshot = await transaction.get(metaRef)
    const metaData = metaSnapshot.exists() ? metaSnapshot.data() : {}

    if (metaData.IsManagerVoteFinalized) {
      return {
        winnerId: metaData.ManagerWinnerId ?? '',
        winnerName: metaData.ManagerWinnerName ?? '',
      }
    }

    currentManagers.forEach((member) => {
      if (member.id !== winner?.id) {
        transaction.update(doc(db, MEMBER_COLLECTION, member.id), {
          IsManager: false,
          UpdatedAt: serverTimestamp(),
        })
      }
    })

    if (winner) {
      transaction.update(doc(db, MEMBER_COLLECTION, winner.id), {
        IsManager: true,
        UpdatedAt: serverTimestamp(),
      })
    }

    transaction.set(
      metaRef,
      {
        IsManagerVoteFinalized: true,
        ManagerWinnerId: winner?.id ?? '',
        ManagerWinnerName: winner?.Name ?? '',
        RoleSlots: normalizeRoleSlots(metaData.RoleSlots),
        UpdatedAt: serverTimestamp(),
      },
      { merge: true },
    )

    return {
      winnerId: winner?.id ?? '',
      winnerName: winner?.Name ?? '',
    }
  })
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
