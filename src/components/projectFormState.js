const emptyProject = {
  name: '',
  phone: '',
  email: '',
  telegram: '',
  discord: '',
  github: '',
  title: '',
  projectType: 'Software',
  requirements: '',
  description: '',
  solution: '',
  pointMultiplier: '1',
  agreedToTerms: false,
}

export function getEmptyProjectForm() {
  return { ...emptyProject }
}
