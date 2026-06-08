const ALL_YEARS = Array.from({ length: 2024 - 2008 + 1 }, (_, i) => 2008 + i);

export const IPL_TEAMS = [
  { name: 'Chennai Super Kings', code: 'CSK', color: '#F9CD05', logo: '/logos/Chennai_Super_Kings.png', activeYears: ALL_YEARS.filter(y => y !== 2016 && y !== 2017) },
  { name: 'Mumbai Indians', code: 'MI', color: '#004BA0', logo: '/logos/Mumbai_Indians.png', activeYears: ALL_YEARS },
  { name: 'Royal Challengers Bangalore', code: 'RCB', color: '#EC1C24', logo: '/logos/Royal_Challengers_Bangalore.png', activeYears: ALL_YEARS },
  { name: 'Kolkata Knight Riders', code: 'KKR', color: '#3A225D', logo: '/logos/Kolkata_Knight_Riders.png', activeYears: ALL_YEARS },
  { name: 'Sunrisers Hyderabad', code: 'SRH', color: '#FF822A', logo: '/logos/Sunrisers_Hyderabad.png', activeYears: ALL_YEARS.filter(y => y >= 2013) },
  { name: 'Delhi Capitals', code: 'DC', color: '#00008B', logo: '/logos/Delhi_Capitals.png', activeYears: ALL_YEARS },
  { name: 'Punjab Kings', code: 'PBKS', color: '#DD1F2D', logo: '/logos/Punjab_Kings.png', activeYears: ALL_YEARS },
  { name: 'Rajasthan Royals', code: 'RR', color: '#EA1A85', logo: '/logos/Rajasthan_Royals.png', activeYears: ALL_YEARS.filter(y => y !== 2016 && y !== 2017) },
  { name: 'Gujarat Titans', code: 'GT', color: '#1B2133', logo: '/logos/Gujarat_Titans.png', activeYears: ALL_YEARS.filter(y => y >= 2022) },
  { name: 'Lucknow Super Giants', code: 'LSG', color: '#0000FF', logo: '/logos/Lucknow_Super_Giants.png', activeYears: ALL_YEARS.filter(y => y >= 2022) },
  { name: 'Deccan Chargers', code: 'DEC', color: '#D1E6E6', logo: '/logos/Deccan_Chargers.png', activeYears: [2008, 2009, 2010, 2011, 2012] },
  { name: 'Kochi Tuskers Kerala', code: 'KTK', color: '#E86629', logo: '/logos/Kochi_Tuskers_Kerala.png', activeYears: [2011] },
  { name: 'Pune Warriors India', code: 'PWI', color: '#2B2B2B', logo: '/logos/Pune_Warriors_India.png', activeYears: [2011, 2012, 2013] },
  { name: 'Gujarat Lions', code: 'GL', color: '#FF7F00', logo: '/logos/Gujarat_Lions.png', activeYears: [2016, 2017] },
  { name: 'Rising Pune Supergiant', code: 'RPS', color: '#D11D70', logo: '/logos/Rising_Pune_Supergiant.png', activeYears: [2016, 2017] }
];

export const IPL_YEARS = ALL_YEARS;

