import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase/config'

const MEMBER_COLLECTION = 'members'
const PROJECT_COLLECTION = 'projects'

function mapProjectSnapshot(projectDoc) {
  const data = projectDoc.data()

  return {
    id: projectDoc.id,
    name: data.Name ?? '',
    phone: data.Phone ?? '',
    email: data.Email ?? '',
    telegram: data.Telegram ?? '',
    discord: data.Discord ?? '',
    github: data.GitHub ?? '',
    title: data.ProjectTitle ?? '',
    projectType: data.ProjectType ?? 'Software',
    requirements: data.Requirements ?? '',
    description: data.Description ?? '',
    solution: data.Solution ?? '',
    agreedToTerms: data.AgreedToTerms ?? false,
    pointMultiplier: Number(data.PointMultiplier ?? 1),
    voteScore: Number(data.VoteScore ?? 0),
    voteCount: Number(data.VoteCount ?? 0),
  }
}

function normalizeProjectInput(project) {
  return {
    Name: project.name?.trim() || '',
    Phone: project.phone?.trim() || '',
    Email: project.email?.trim() || '',
    Telegram: project.telegram?.trim() || '',
    Discord: project.discord?.trim() || '',
    GitHub: project.github?.trim() || '',
    ProjectTitle: project.title.trim(),
    ProjectType: project.projectType,
    Requirements: project.requirements.trim(),
    Description: project.description.trim(),
    Solution: project.solution.trim(),
    AgreedToTerms: Boolean(project.agreedToTerms),
    PointMultiplier: Number(project.pointMultiplier) || 1,
  }
}

function getMemberProjectPayload(project, memberId) {
  return {
    ...normalizeProjectInput({
      ...project,
      pointMultiplier: 1,
    }),
    VoteScore: 0,
    VoteCount: 0,
    CreatedAt: serverTimestamp(),
    UpdatedAt: serverTimestamp(),
    SubmittedByMemberId: memberId,
  }
}

export function subscribeToProjects(onProjects, onError) {
  const projectsRef = collection(db, PROJECT_COLLECTION)

  return onSnapshot(
    projectsRef,
    (snapshot) => {
      const projects = snapshot.docs
        .map(mapProjectSnapshot)
        .sort((left, right) => left.title.localeCompare(right.title))

      onProjects(projects)
    },
    onError,
  )
}

export async function createProject(project) {
  const payload = normalizeProjectInput(project)

  await addDoc(collection(db, PROJECT_COLLECTION), {
    ...payload,
    VoteScore: 0,
    VoteCount: 0,
    CreatedAt: serverTimestamp(),
    UpdatedAt: serverTimestamp(),
  })
}

export async function submitMemberProject({ memberId, project }) {
  return runTransaction(db, async (transaction) => {
    const memberRef = doc(db, MEMBER_COLLECTION, memberId)
    const projectRef = doc(collection(db, PROJECT_COLLECTION))
    const memberSnapshot = await transaction.get(memberRef)

    if (!memberSnapshot.exists()) {
      throw new Error('Member record not found.')
    }

    const memberData = memberSnapshot.data()

    if (memberData.HasProject) {
      throw new Error('You have already submitted a project in Preparation.')
    }

    transaction.set(projectRef, getMemberProjectPayload(project, memberId))
    transaction.update(memberRef, {
      HasProject: true,
      SubmittedProjectId: projectRef.id,
      UpdatedAt: serverTimestamp(),
    })

    return {
      projectId: projectRef.id,
    }
  })
}

export async function updateProject(projectId, project) {
  const payload = normalizeProjectInput(project)

  await updateDoc(doc(db, PROJECT_COLLECTION, projectId), {
    ...payload,
    UpdatedAt: serverTimestamp(),
  })
}

export async function removeProject(projectId) {
  await deleteDoc(doc(db, PROJECT_COLLECTION, projectId))
}

export async function castVote({ memberId, projectId }) {
  return runTransaction(db, async (transaction) => {
    const memberRef = doc(db, MEMBER_COLLECTION, memberId)
    const projectRef = doc(db, PROJECT_COLLECTION, projectId)

    const memberSnapshot = await transaction.get(memberRef)
    const projectSnapshot = await transaction.get(projectRef)

    if (!memberSnapshot.exists()) {
      throw new Error('Member record not found.')
    }

    if (!projectSnapshot.exists()) {
      throw new Error('Project record not found.')
    }

    const memberData = memberSnapshot.data()
    const projectData = projectSnapshot.data()
    const submittedProjectId = String(memberData.SubmittedProjectId ?? '').trim()

    if (memberData.HasVoted) {
      throw new Error('You have already voted.')
    }

    if (submittedProjectId && submittedProjectId === projectId) {
      throw new Error('You cannot vote for your own project.')
    }

    const votePoint = Number(memberData.VotePoint ?? 1)
    const multiplier = Number(projectData.PointMultiplier ?? 1)
    const addedScore = votePoint * multiplier
    const nextVoteScore = Number(projectData.VoteScore ?? 0) + addedScore
    const nextVoteCount = Number(projectData.VoteCount ?? 0) + 1

    transaction.update(projectRef, {
      VoteScore: nextVoteScore,
      VoteCount: nextVoteCount,
      UpdatedAt: serverTimestamp(),
    })

    transaction.update(memberRef, {
      HasVoted: true,
      VotedProjectId: projectId,
      UpdatedAt: serverTimestamp(),
    })

    return {
      addedScore,
      votePoint,
      multiplier,
    }
  })
}

export { PROJECT_COLLECTION }
