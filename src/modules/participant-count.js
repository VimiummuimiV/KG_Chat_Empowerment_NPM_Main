import { createCustomTooltip } from "./tooltip"; // tooltip

const rankData = {
  extra: '🚀',
  cyber: '🤖',
  superman: '👊',
  maniac: '🔪',
  racer: '⚡️',
  profi: '💼',
  driver: '🚖',
  amateur: '🍆',
  newbie: '🐥'
};

export function createChatUserCounter(panel, initialCount = 0) {
  const counter = document.createElement('div');
  counter.classList.add("participant-count");
  counter.innerHTML = initialCount.toString();
  if (panel) panel.appendChild(counter);

  // Function to get the latest rank keys and compute user counts
  function getUpdatedUserCounts() {
    const ranks = Object.keys(rankData);
    return ranks.reduce((counts, rank) => {
      const count = document.getElementsByClassName(rank).length;
      if (count > 0) {
        counts.push(`${rankData[rank]}${count}`);
      }
      return counts;
    }, []);
  }

  // Function to update the tooltip with current data
  function updateTooltip() {
    const userCounts = getUpdatedUserCounts();
    const tooltipText = userCounts.join(" ");
    createCustomTooltip(counter, tooltipText);
  }

  counter.addEventListener("mouseover", updateTooltip);
}
