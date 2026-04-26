const emptyProject = {
  title: '',
  projectType: 'Software',
  requirements: '',
  description: '',
  solution: '',
  pointMultiplier: '1',
}

export function getEmptyProjectForm() {
  return { ...emptyProject }
}
