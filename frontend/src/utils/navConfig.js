export function getNavForRole(role) {
  const common = [
    { to: '/map', labelKey: 'nav.map' },
    { to: '/alerts', labelKey: 'nav.alerts' },
  ];

  switch (role) {
    case 'citizen':
      return [
        { to: '/dashboard', labelKey: 'nav.dashboard' },
        ...common,
        { to: '/resources', labelKey: 'nav.resources' },
        { to: '/shelters', labelKey: 'nav.shelters' },
        { to: '/hospitals', labelKey: 'nav.hospitals' },
        { to: '/community', labelKey: 'nav.community' },
        { to: '/preparedness', labelKey: 'nav.preparedness' },
      ];
    case 'volunteer':
      return [
        { to: '/volunteer', labelKey: 'nav.myTasks' },
        ...common,
        { to: '/resources', labelKey: 'nav.resources' },
        { to: '/shelters', labelKey: 'nav.shelters' },
      ];
    case 'responder':
      return [
        { to: '/responder', labelKey: 'nav.dashboard' },
        ...common,
        { to: '/teams', labelKey: 'nav.rescueTeams' },
        { to: '/community', labelKey: 'nav.verifyReports' },
        { to: '/missing-persons', labelKey: 'nav.missingPersons' },
      ];
    case 'coordinator':
      return [
        { to: '/coordinator', labelKey: 'nav.commandCenter' },
        ...common,
        { to: '/teams', labelKey: 'nav.rescueTeams' },
        { to: '/shelters', labelKey: 'nav.shelters' },
        { to: '/resources', labelKey: 'nav.resources' },
        { to: '/community', labelKey: 'nav.verification' },
        { to: '/missing-persons', labelKey: 'nav.missingPersons' },
      ];
    case 'ngo':
      return [
        { to: '/ngo', labelKey: 'nav.dashboard' },
        ...common,
        { to: '/shelters', labelKey: 'nav.shelters' },
        { to: '/resources', labelKey: 'nav.resources' },
      ];
    case 'hospital':
      return [
        { to: '/hospital', labelKey: 'nav.dashboard' },
        ...common,
      ];
    case 'admin':
      return [
        { to: '/admin', labelKey: 'nav.commandCenter' },
        { to: '/admin/users', labelKey: 'nav.manageUsers' },
        ...common,
        { to: '/teams', labelKey: 'nav.rescueTeams' },
        { to: '/shelters', labelKey: 'nav.shelters' },
        { to: '/hospitals', labelKey: 'nav.hospitals' },
        { to: '/resources', labelKey: 'nav.resources' },
        { to: '/community', labelKey: 'nav.verification' },
        { to: '/missing-persons', labelKey: 'nav.missingPersons' },
      ];
    default:
      return [
        { to: '/map', labelKey: 'nav.map' },
        { to: '/alerts', labelKey: 'nav.alerts' },
        { to: '/resources', labelKey: 'nav.resources' },
      ];
  }
}
