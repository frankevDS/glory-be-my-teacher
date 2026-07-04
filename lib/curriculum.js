// lib/curriculum.js
//
// PROVENANCE NOTE (read this before editing):
// - Ghana data below is drawn from NaCCA's official "Subject Combinations" guide
//   (nacca.gov.gh/wp-content/uploads/2025/02/Subject-Combinations.pdf) and the
//   GES/NaCCA SHS curriculum resources published at curriculumresources.edu.gh.
//   Ghana is mid-transition from the old WASSCE-track syllabus to the new
//   Common Core Programme (CCP) for SHS — schools are not all on the same
//   version yet. Verify against your own school's track before exams.
// - Nigeria, UK and USA structures below are representative national
//   frameworks (NERDC senior secondary structure, UK GCSE/A-Level subject
//   sets, US Common Core core-subject areas). They are NOT pulled from a
//   single official PDF the way the Ghana data is, because there is no single
//   national syllabus PDF for the UK/USA (exam boards / states differ) and
//   because Nigeria's NERDC portal was not directly verifiable in this build.
//   Treat these as a strong starting scaffold, not a certified syllabus —
//   swap in your exam board (AQA/OCR/Edexcel), state standards, or WAEC/NECO
//   syllabus documents as you get them, using the same JSON shape.
//
// HOW THE AI USES THIS FILE:
// The tutor API route sends the matched subject/track/level info as grounding
// context to the model and explicitly tells it which parts are official vs
// representative, so Glory (or any student) always knows how much to trust
// a given answer.

export const COUNTRIES = {
  ghana: {
    name: "Ghana",
    levelLabel: "SHS",
    verified: true,
    source: "NaCCA Subject Combinations (2025) — nacca.gov.gh",
    levels: ["SHS 1", "SHS 2", "SHS 3"],
    core: [
      "English Language",
      "Core Mathematics",
      "Integrated Science",
      "Social Studies",
      "Physical Education & Health (core)",
    ],
    tracks: {
      "General Science": [
        "Elective Mathematics",
        "Biology",
        "Chemistry",
        "Physics",
        "Robotics/ICT",
        "Agricultural Science",
      ],
      "General Arts": [
        "Economics",
        "Geography",
        "Government",
        "History",
        "Literature in English",
        "French",
        "Religious Studies",
        "Elective Mathematics",
      ],
      Business: [
        "Financial Accounting",
        "Business Management",
        "Cost Accounting",
        "Economics",
        "Elective Mathematics",
        "Computing",
      ],
      "Visual Arts": [
        "General Knowledge in Art",
        "Graphic Design",
        "Picture Making",
        "Textiles",
        "Sculpture",
        "Ceramics",
        "Economics",
      ],
      "Home Economics": [
        "Food and Nutrition",
        "Management in Living",
        "Clothing and Textiles",
        "Chemistry",
        "Biology",
        "Economics",
      ],
      Agriculture: [
        "General Agriculture",
        "Animal Husbandry",
        "Chemistry",
        "Biology",
        "Physics",
        "Economics",
      ],
    },
  },

  nigeria: {
    name: "Nigeria",
    levelLabel: "SS",
    verified: false,
    source: "Representative NERDC senior secondary structure — verify against current WAEC/NECO/NERDC syllabus",
    levels: ["SS 1", "SS 2", "SS 3"],
    core: [
      "English Language",
      "Mathematics",
      "Civic Education",
      "Trade/Entrepreneurship Subject",
    ],
    tracks: {
      Science: [
        "Physics",
        "Chemistry",
        "Biology",
        "Further Mathematics",
        "Agricultural Science",
        "Geography",
      ],
      Arts: [
        "Literature in English",
        "Government",
        "History",
        "Christian/Islamic Religious Studies",
        "Fine Arts",
        "French",
      ],
      Commercial: [
        "Financial Accounting",
        "Commerce",
        "Economics",
        "Marketing",
        "Office Practice",
      ],
    },
  },

  uk: {
    name: "United Kingdom",
    levelLabel: "Key Stage / Sixth Form",
    verified: false,
    source: "Representative structure based on GCSE (KS4) and A-Level (Sixth Form) subject sets — exam boards (AQA/Edexcel/OCR) vary in detail",
    levels: ["Year 10 (GCSE, ~SHS1 equivalent)", "Year 11 (GCSE, ~SHS2 equivalent)", "Year 12/13 (A-Level, ~SHS3 equivalent)"],
    core: [
      "English Language",
      "Mathematics",
      "Combined/Triple Science",
    ],
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
    levels: ["Grade 9 (Freshman, ~SHS1 equivalent)", "Grade 10-11 (~SHS2 equivalent)", "Grade 12 (~SHS3 equivalent)"],
    core: [
      "English Language Arts",
      "Mathematics (Algebra I-II, Geometry)",
      "Science (Biology, Chemistry, Physics)",
      "Social Studies/US History",
    ],
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
  return [...country.core, ...trackSubjects];
}
