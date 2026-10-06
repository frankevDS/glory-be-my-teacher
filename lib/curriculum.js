// lib/curriculum.js
//
// Ghana SHS curriculum catalog.
//
// IMPORTANT:
// - NaCCA's 2025 Subject Combination Guidelines define the CURRENT new SHS/SHTS
//   learning-area structure and four subject groups: Core, Learning Area
//   Electives, Related Learning Area Electives, and Other Electives.
// - WAEC's published WASSCE materials include both the current/new curriculum
//   transition and legacy WASSCE programme names. We keep legacy subjects
//   separately so past-question retrieval can support them without presenting
//   them as the default current SHS pathway.
// - A subject being in this catalog means it is recognized in the official
//   curriculum/examination ecosystem; it does NOT mean every learner must study it.

export const GHANA_CORE_SUBJECTS = [
  "Mathematics",
  "Social Studies",
  "English Language",
  "General Science",
];

export const GHANA_CORE_NON_EXAMINABLE = [
  "Physical Education & Health (PEH)",
];

export const GHANA_CONDITIONAL_MANDATORY = [
  "Robotics and Coding (SHS 2, where facilities are available)",
];

export const GHANA_LOCAL_LANGUAGES = [
  "Dagaare",
  "Dagbani",
  "Dangme",
  "Ewe",
  "Fante",
  "Ga",
  "Gonja",
  "Kasem",
  "Nzema",
  "Twi (Akuapem)",
  "Twi (Asante)",
];

export const GHANA_FOREIGN_LANGUAGES = [
  "French",
  "Arabic",
  "Spanish",
];

// Subjects explicitly represented in the current NaCCA SHS curriculum catalog
// and/or the official 2025 subject-combination guidelines.
export const GHANA_CURRENT_SUBJECTS = [
  ...GHANA_CORE_SUBJECTS,
  ...GHANA_CORE_NON_EXAMINABLE,
  "Robotics and Coding",
  "Biology",
  "Chemistry",
  "Physics",
  "Additional Mathematics",
  "Mathematics",
  "Economics",
  "Geography",
  "Government",
  "History",
  "Christian Religious Studies",
  "Islamic Religious Studies",
  "Religious and Moral Education (RME)",
  "Literature in English",
  "Music",
  "Ghanaian Language",
  ...GHANA_LOCAL_LANGUAGES,
  ...GHANA_FOREIGN_LANGUAGES,
  "Business Management",
  "Accounting",
  "Computer Science",
  "Computing",
  "ICT",
  "Design & Communication Technology",
  "Agriculture",
  "Agricultural Science",
  "Food and Nutrition",
  "Clothing and Textiles",
  "Management in Living",
  "Art and Design Foundation",
  "Art and Design Studio",
  "Performing Arts",
  "Automobile and Metal Technology",
  "Building Construction and Wood Technology",
  "Electrical and Electronic Technology",
  "General Science",
  "Engineering",
  "Biomedical Science",
  "Manufacturing Engineering",
  "Information Technology",
  "Aviation and Aerospace Engineering",
  "Law and Diplomacy",
  "International Trade",
];

// WAEC-published legacy programme subjects. These remain important for
// historical past questions and transition cohorts, but are NOT silently
// presented as the new NaCCA pathway.
export const GHANA_WAEC_LEGACY_SUBJECTS = [
  "Integrated Science",
  "Financial Accounting",
  "Principles of Cost Accounting",
  "Typewriting (40wpm)",
  "Clerical Office Duties",
  "Technical Drawing",
  "Applied Electricity",
  "Auto Mechanics",
  "Building Construction",
  "Electronics",
  "Metalwork",
  "Woodwork",
  "General Agriculture",
  "Animal Husbandry",
  "Crop Husbandry and Horticulture",
  "Fisheries",
  "Forestry",
  "General Knowledge-in-Art",
  "Graphic Design",
  "Picture Making",
  "Basketry",
  "Ceramics",
  "Jewellery",
  "Leatherwork",
  "Sculpture",
  "Textiles",
  "West Africa Traditional Religion",
];

const CORE = {
  group: "core",
  required: true,
  externallyExaminable: true,
};

const PEH_CORE = {
  group: "core",
  required: true,
  externallyExaminable: false,
};

const ROBOTICS = {
  group: "conditional-core",
  required: false,
  condition: "Mandatory for all SHS 2 learners if facilities are available; internally assessed.",
  externallyExaminable: false,
};

export const GHANA_SUBJECT_METADATA = {
  "Mathematics": CORE,
  "Social Studies": CORE,
  "English Language": CORE,
  "General Science": CORE,
  "Physical Education & Health (PEH)": PEH_CORE,
  "Robotics and Coding": ROBOTICS,
};

export const GHANA_LEARNING_AREAS = {
  Science: {
    core: GHANA_CORE_SUBJECTS,
    groupB: ["Biology", "Chemistry", "Physics"],
    groupC: ["Additional Mathematics", "Automobile and Metal Technology", "Building Construction and Wood Technology", "Electrical and Electronic Technology", "Design & Communication Technology", "Food and Nutrition", "Clothing and Textiles", "Art and Design Foundation", "ICT", "Agriculture", "Computer Science", "Geography", "PEH (Elective)"],
    groupD: ["Economics", "Government", "History", "Christian Religious Studies", "Islamic Religious Studies", "RME", "Ghanaian Language", "Arabic", "French", "Literature in English", "Music", "Management in Living", "Performing Arts", "Business Management", "Accounting", "Art and Design Studio"],
  },
  "General Arts": {
    core: GHANA_CORE_SUBJECTS,
    groupB: ["Economics", "Geography", "Government", "History", "Christian Religious Studies", "Islamic Religious Studies", "Literature in English", "Music"],
    groupC: ["Art and Design Foundation", "Performing Arts", "Ghanaian Language", "Arabic", "French", "Spanish", "Management in Living", "RME", "Business Management", "Accounting"],
    groupD: ["Agriculture", "Biology", "Chemistry", "Computer Science", "Physics", "Additional Mathematics", "Agricultural Science", "ICT", "PEH (Elective)", "Automobile and Metal Technology", "Building Construction and Wood Technology", "Electrical and Electronic Technology", "Food and Nutrition", "Clothing and Textiles", "Art and Design Studio"],
  },
  Business: {
    core: GHANA_CORE_SUBJECTS,
    groupB: ["Business Management", "Accounting", "Economics", "Computer Science (ICT in Business)", "Additional Mathematics"],
    groupC: ["Arabic", "French", "Spanish", "Music", "Food and Nutrition", "Clothing and Textiles", "Management in Living", "Design & Communication Technology", "Art and Design Studio", "Agricultural Science", "Government", "History", "Performing Arts"],
    groupD: ["Agriculture", "Biology", "Chemistry", "Physics", "PEH (Elective)", "Geography", "Christian Religious Studies", "Islamic Religious Studies", "Literature in English", "Art and Design Foundation"],
  },
  "Applied Technology": {
    core: GHANA_CORE_SUBJECTS,
    groupB: ["Design & Communication Technology", "Automobile and Metal Technology", "Building Construction and Wood Technology", "Electrical and Electronic Technology", "Physics", "Additional Mathematics", "Art and Design Foundation"],
    groupC: ["Agriculture", "Biology", "Chemistry", "Computer Science", "PEH (Elective)", "Art and Design Studio", "Food and Nutrition", "Clothing and Textiles", "ICT", "Agricultural Science", "Business Management"],
    groupD: ["Geography", "Economics", "Government", "History", "Christian Religious Studies", "Islamic Religious Studies", "RME", "Literature in English", "Ghanaian Language", "Arabic", "French", "Music", "Accounting", "Management in Living", "Performing Arts"],
  },
  "Home Economics": {
    core: GHANA_CORE_SUBJECTS,
    groupB: ["Management in Living", "Clothing and Textiles", "Food and Nutrition", "Biology", "Chemistry"],
    groupC: ["Art and Design Foundation", "Art and Design Studio", "Performing Arts", "Physics", "Additional Mathematics", "ICT", "PEH (Elective)", "Economics", "Agricultural Science", "Arabic", "French", "Ghanaian Language", "Business Management", "Accounting"],
    groupD: ["Geography", "Government", "History", "Christian Religious Studies", "Islamic Religious Studies", "RME", "Literature in English", "Computer Science", "Music", "Automobile and Metal Technology", "Building Construction and Wood Technology", "Electrical and Electronic Technology"],
  },
  "Visual and Performing Arts": {
    core: GHANA_CORE_SUBJECTS,
    groupB: ["Art and Design Foundation", "Art and Design Studio", "Design & Communication Technology", "Music", "Performing Arts"],
    groupC: ["Automobile and Metal Technology", "Building Construction and Wood Technology", "Electrical and Electronic Technology", "Management in Living", "Food and Nutrition", "Clothing and Textiles", "History", "Literature in English", "Ghanaian Language", "Arabic", "French", "Business Management", "PEH (Elective)"],
    groupD: ["Agriculture", "Chemistry", "Computer Science", "Physics", "Additional Mathematics", "Agricultural Science", "ICT", "Christian Religious Studies", "Islamic Religious Studies", "RME", "Geography", "Government", "Economics", "Accounting", "Biology"],
  },
  Agriculture: {
    core: GHANA_CORE_SUBJECTS,
    groupB: ["Agriculture", "Chemistry", "Physics", "Biology"],
    groupC: ["Food and Nutrition", "Clothing and Textiles", "Design & Communication Technology", "Computer Science", "Additional Mathematics", "ICT", "PEH (Elective)", "Automobile and Metal Technology", "Building Construction and Wood Technology", "Electrical and Electronic Technology", "Economics", "Geography", "Business Management"],
    groupD: ["Government", "Literature in English", "Christian Religious Studies", "Islamic Religious Studies", "RME", "Music", "Management in Living", "Accounting", "Performing Arts", "Ghanaian Language", "French", "Arabic", "Art and Design Foundation", "Art and Design Studio"],
  },
  Languages: {
    core: GHANA_CORE_SUBJECTS,
    groupB: ["Ghanaian Language", "French", "Arabic", "Spanish", "Literature in English"],
    groupC: ["Economics", "Geography", "Government", "History", "Christian Religious Studies", "Islamic Religious Studies", "RME", "Art and Design Foundation", "Performing Arts", "Management in Living", "Music"],
    groupD: ["Biology", "Chemistry", "Computer Science", "Physics", "Additional Mathematics", "Agricultural Science", "PEH (Elective)", "Agriculture", "Business Management", "Accounting", "Food and Nutrition", "Clothing and Textiles", "ICT", "Automobile and Metal Technology", "Building Construction and Wood Technology", "Electrical and Electronic Technology", "Design & Communication Technology", "Art and Design Studio"],
  },
  "Global Studies": {
    core: GHANA_CORE_SUBJECTS,
    groupB: ["Geography", "Law and Diplomacy", "French", "Arabic", "Spanish", "International Trade"],
    groupC: ["Business Management", "Accounting", "Economics", "Government", "History", "Design & Communication Technology", "Performing Arts", "Literature in English"],
    groupD: ["Biology", "Chemistry", "Computer Science", "Physics", "Additional Mathematics", "Agricultural Science", "Automobile and Metal Technology", "Building Construction and Wood Technology", "Electrical and Electronic Technology", "Art and Design Studio"],
  },
};

export const GHANA_STEM_SUBJECTS = [
  "Engineering",
  "Biomedical Science",
  "Manufacturing Engineering",
  "Information Technology",
  "Computer Science",
  "Robotics",
  "Aviation and Aerospace",
];

export const COUNTRIES = {
  ghana: {
    name: "Ghana",
    levelLabel: "SHS",
    // Country-level authority is official; individual subject grounding becomes
    // verified only after that subject's official document has been indexed.
    verified: false,
    authority: "National Council for Curriculum and Assessment (NaCCA)",
    source: "NaCCA Secondary Education Curriculum and Subject Combination Guidelines",
    sourceUrl: "https://nacca.gov.gh/subject-combination-guidelines-secondary-education/",
    levels: ["SHS 1", "SHS 2", "SHS 3"],
    core: GHANA_CORE_SUBJECTS,
    coreNonExaminable: GHANA_CORE_NON_EXAMINABLE,
    conditionalMandatory: GHANA_CONDITIONAL_MANDATORY,
    learningAreas: GHANA_LEARNING_AREAS,
    stemSubjects: GHANA_STEM_SUBJECTS,
    localLanguages: GHANA_LOCAL_LANGUAGES,
    foreignLanguages: GHANA_FOREIGN_LANGUAGES,
    currentSubjects: GHANA_CURRENT_SUBJECTS,
    legacyWaecSubjects: GHANA_WAEC_LEGACY_SUBJECTS,
    tracks: Object.fromEntries(Object.entries(GHANA_LEARNING_AREAS).map(([name, data]) => [
      name,
      [...new Set([...data.groupB, ...data.groupC, ...data.groupD])],
    ])),
  },

  nigeria: {
    name: "Nigeria",
    levelLabel: "SS",
    verified: false,
    source: "Representative NERDC senior secondary structure — verify against current WAEC/NECO/NERDC syllabus",
    levels: ["SS 1", "SS 2", "SS 3"],
    core: ["English Language", "Mathematics", "Civic Education", "Trade/Entrepreneurship Subject"],
    tracks: {
      Science: ["Physics", "Chemistry", "Biology", "Further Mathematics", "Agricultural Science", "Geography"],
      Arts: ["Literature in English", "Government", "History", "Christian/Islamic Religious Studies", "Fine Arts", "French"],
      Commercial: ["Financial Accounting", "Commerce", "Economics", "Marketing", "Office Practice"],
    },
  },

  uk: {
    name: "United Kingdom",
    levelLabel: "Key Stage / Sixth Form",
    verified: false,
    source: "Representative structure based on GCSE (KS4) and A-Level (Sixth Form) subject sets — exam boards vary",
    levels: ["Year 10", "Year 11", "Year 12/13"],
    core: ["English Language", "Mathematics", "Combined/Triple Science"],
    tracks: {
      Sciences: ["Physics", "Chemistry", "Biology", "Further Maths", "Computer Science"],
      Humanities: ["History", "Geography", "Religious Studies", "Sociology", "Politics"],
      "Business & Social Science": ["Business Studies", "Economics", "Psychology"],
      "Arts & Languages": ["Art & Design", "French", "Spanish", "Music", "Drama"],
    },
  },

  usa: {
    name: "United States",
    levelLabel: "Grade",
    verified: false,
    source: "Representative Common Core / typical state graduation requirements — actual requirements vary by state",
    levels: ["Grade 9", "Grade 10-11", "Grade 12"],
    core: ["English Language Arts", "Mathematics", "Science", "Social Studies"],
    tracks: {
      "STEM Electives": ["AP Computer Science", "AP Physics", "AP Calculus", "Environmental Science"],
      "Humanities Electives": ["AP US History", "AP Government", "World Languages", "Psychology"],
      "Business Electives": ["AP Economics", "Personal Finance", "Business Management"],
      "Arts Electives": ["Studio Art", "Music Theory", "Theatre"],
    },
  },
};

export function getCountry(key) {
  return COUNTRIES[key];
}

export function listSubjectsFor(countryKey, trackKey) {
  const country = COUNTRIES[countryKey];
  if (!country) return [];
  const trackSubjects = trackKey ? country.tracks[trackKey] || [] : [];
  return [...new Set([...(country.core || []), ...(country.coreNonExaminable || []), ...trackSubjects])];
}
