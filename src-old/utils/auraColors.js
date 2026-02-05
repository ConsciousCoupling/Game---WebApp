const auraPalette = [
  "#F4D03F", // Yellow
  "#58D68D", // Green
  "#5DADE2", // Blue
  "#EC7063", // Red
  "#AF7AC5"  // Purple
];

export function getRandomAuraColor(excludeColor = null) {
  const options = excludeColor
    ? auraPalette.filter((c) => c !== excludeColor)
    : auraPalette;

  const index = Math.floor(Math.random() * options.length);
  return options[index];
}