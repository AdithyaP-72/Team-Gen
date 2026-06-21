// Candidate pool generation with Domain Sub-Specialty Tweak (Option 1)
export const ROLES = ["Developer", "Designer", "Presenter", "Manager"];

export const SUB_ROLES = {
  Developer: [
    { name: "Next.js / Frontend", skills: ["React", "Next.js", "TailwindCSS", "TypeScript", "HTML/CSS"] },
    { name: "FastAPI / Backend", skills: ["FastAPI", "Python", "PostgreSQL", "REST APIs", "SQL"] },
    { name: "PyTorch / MLOps", skills: ["PyTorch", "Python", "TensorFlow", "Scikit-Learn", "Data Prep"] },
    { name: "Docker / AWS DevOps", skills: ["Docker", "AWS", "CI/CD", "Linux", "Kubernetes"] }
  ],
  Designer: [
    { name: "UI-UX / Figma Specialist", skills: ["Figma", "UI Design", "Wireframing", "Prototyping", "User Research"] },
    { name: "Web / Interaction Designer", skills: ["Figma", "Illustrator", "Web Design", "CSS Animation", "SVG"] }
  ],
  Presenter: [
    { name: "Pitching & Communications", skills: ["Public Speaking", "Slide Design", "Pitching", "Storytelling", "Client Management"] },
    { name: "Technical Writer & Presenter", skills: ["Technical Writing", "Documentation", "Presentation", "Product Demos", "SEO"] }
  ],
  Manager: [
    { name: "Agile / Scrum Master", skills: ["Agile", "Scrum", "Jira", "Sprint Planning", "Risk Management"] },
    { name: "Product & Strategy Lead", skills: ["Roadmapping", "Product Strategy", "Market Analysis", "Team Coordination", "Budgeting"] }
  ]
};

// Generates a mock pool of N candidates
export function generateCandidatePool(size = 50) {
  const candidates = [];
  const names = [
    "Aarav", "Ananya", "Aditya", "Diya", "Vihaan", "Kavya", "Rahul", "Isha", "Arjun", "Riya",
    "Sai", "Pranav", "Sneha", "Rohan", "Tanvi", "Yash", "Shruti", "Kabir", "Meera", "Dev",
    "Aditi", "Ishaan", "Tara", "Karan", "Nisha", "Siddharth", "Pooja", "Vikram", "Neha", "Varun",
    "Rudra", "Sanya", "Neil", "Anjali", "Rishi", "Ritu", "Samar", "Kriti", "Akash", "Payal",
    "Dhruv", "Avani", "Manish", "Divya", "Gaurav", "Simran", "Abhishek", "Komal", "Mayank", "Shreya",
    "Vijay", "Geeta", "Sanjay", "Anu", "Rajesh", "Sunita", "Anil", "Rita", "Ramesh", "Deepa"
  ];

  for (let i = 0; i < size; i++) {
    // Distribute roles: Developer (45%), Designer (20%), Presenter (15%), Manager (20%)
    let role;
    const rand = Math.random();
    if (rand < 0.45) role = "Developer";
    else if (rand < 0.65) role = "Designer";
    else if (rand < 0.80) role = "Presenter";
    else role = "Manager";

    const subRoleOptions = SUB_ROLES[role];
    const chosenSubRole = subRoleOptions[Math.floor(Math.random() * subRoleOptions.length)];

    // Generate numeric attributes
    // CGPA from 6.0 to 10.0
    const cgpa = parseFloat((6.0 + Math.random() * 4.0).toFixed(2));
    // Communication from 5 to 10
    const communication = parseFloat((5.0 + Math.random() * 5.0).toFixed(1));
    // Experience from 0 to 5 years
    const experience = parseFloat((Math.random() * 5).toFixed(1));

    candidates.push({
      id: `C${String(i + 1).padStart(3, '0')}`,
      name: names[i % names.length] + (i >= names.length ? ` ${Math.floor(i / names.length) + 1}` : ""),
      role,
      subRole: chosenSubRole.name,
      skills: [...chosenSubRole.skills],
      cgpa,
      communication,
      experience
    });
  }
  return candidates;
}

// Check structural feasibility of a team:
// 1. Unique candidates (no duplicates)
// 2. Correct team size K
// 3. Satisfies all role requirements
export function isFeasible(team, teamSize, roleRequirements) {
  if (team.length !== teamSize) return false;

  // Check uniqueness of candidates
  const ids = new Set(team.map(m => m.id));
  if (ids.size !== team.length) return false;

  // Check if role requirements are met
  const roleCounts = {};
  for (const member of team) {
    roleCounts[member.role] = (roleCounts[member.role] || 0) + 1;
  }

  for (const role of Object.keys(roleRequirements)) {
    const required = roleRequirements[role] || 0;
    const actual = roleCounts[role] || 0;
    if (actual < required) {
      return false;
    }
  }

  return true;
}

// Compute the fitness score of a team based on metrics and weights
// Default weights: skills: 40%, cgpa: 20%, comm: 20%, exp: 20%
export function computeTeamScore(team, weights = { skillDiversity: 40, cgpa: 20, communication: 20, experience: 20 }) {
  if (team.length === 0) return 0;

  // 1. Skill Diversity Score (Domain Sub-Specialties Tweak)
  // Gather all unique skills from all members
  const allSkills = new Set();
  const subRoles = new Set();
  
  for (const member of team) {
    member.skills.forEach(skill => allSkills.add(skill));
    subRoles.add(member.subRole);
  }

  // Base diversity on number of unique sub-roles relative to team size
  // and overall number of unique skills (aiming for at least 8 unique skills for K=4)
  const targetSkillsCount = Math.max(8, team.length * 2);
  const skillDivRatio = Math.min(allSkills.size / targetSkillsCount, 1.0) * 100;
  
  const subRoleDivRatio = (subRoles.size / team.length) * 100;
  
  // Combine: 40% subrole uniqueness + 60% raw skill breadth
  const skillDiversityScore = 0.4 * subRoleDivRatio + 0.6 * skillDivRatio;

  // 2. Academic Score (Average CGPA mapped to 0-100)
  const avgCgpa = team.reduce((sum, m) => sum + m.cgpa, 0) / team.length;
  const cgpaScore = (avgCgpa / 10.0) * 100;

  // 3. Communication Score (Average Communication mapped to 0-100)
  const avgComm = team.reduce((sum, m) => sum + m.communication, 0) / team.length;
  const commScore = (avgComm / 10.0) * 100;

  // 4. Experience Score (Average Experience mapped to 0-100, assuming max 5 years is 100%)
  const avgExp = team.reduce((sum, m) => sum + m.experience, 0) / team.length;
  const expScore = Math.min((avgExp / 5.0) * 100, 100);

  // Weighted combination
  const totalWeight = weights.skillDiversity + weights.cgpa + weights.communication + weights.experience;
  if (totalWeight === 0) return 0;

  const finalScore = (
    skillDiversityScore * weights.skillDiversity +
    cgpaScore * weights.cgpa +
    commScore * weights.communication +
    expScore * weights.experience
  ) / totalWeight;

  return {
    fitness: parseFloat(finalScore.toFixed(2)),
    breakdown: {
      skillDiversity: parseFloat(skillDiversityScore.toFixed(1)),
      cgpa: parseFloat(cgpaScore.toFixed(1)),
      communication: parseFloat(commScore.toFixed(1)),
      experience: parseFloat(expScore.toFixed(1)),
      rawAvgCgpa: parseFloat(avgCgpa.toFixed(2)),
      rawAvgComm: parseFloat(avgComm.toFixed(1)),
      rawAvgExp: parseFloat(avgExp.toFixed(1)),
      uniqueSkills: allSkills.size
    }
  };
}
