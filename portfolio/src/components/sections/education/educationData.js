/*
  Turns content.js into the flat data used by the stacking Education section.
  All wording lives in content.js; this file only reshapes and labels it.
*/
export function buildEducationData(content) {
  const section = content.sections.find((s) => s.id === "education") || {};
  const [school, bca, mern, now] = content.education;

  const head = {
    num: section.num ?? "05",
    label: section.label ?? "EDUCATION",
    lines: section.headline ?? ["EDUCATION", "THE ROUTE SO FAR"],
    tagline: content.educationTagline,
  };

  const makeCard = (e, { tag, title = e.title, text = e.studied, chips = e.tools, script = e.story }) => ({
    stage: e.stage,
    level: `LEVEL ${e.stage}`,
    tag,
    title,
    place: e.place,
    meta: `${e.period} · ${e.status}`,
    studied: text,
    points: e.learned || [],
    chips: chips || [],
    script: script || "",
    next: e.next || "",
  });

  const cards = [
    makeCard(school, { tag: school.year || "SCHOOL" }),
    makeCard(bca, { tag: bca.yearTag || bca.level }),
    makeCard(mern, { tag: mern.yearTag || mern.level }),
    makeCard(now, {
      tag: "OPEN TO WORK",
      title: "Open to work and grow my talent",
      text: now.note || now.studied,
      chips: now.roles || [],
    }),
  ];

  const achievements = {
    title: content.achievements.title,
    cardTitle: content.achievements.cardTitle,
    cardLine: content.achievements.cardLine,
    tagline: content.achievements.tagline,
    items: content.achievements.items.map((item, index) => ({ ...item, index })),
  };

  return { head, cards, achievements };
}
