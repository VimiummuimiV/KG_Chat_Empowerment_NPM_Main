import { createCustomTooltip } from "./tooltip.js";

const rankData = {
  extra: { emoji: '🚀', name: 'Экстракиберы' },
  cyber: { emoji: '🤖', name: 'Кибергонщики' },
  superman: { emoji: '👊', name: 'Супермэны' },
  maniac: { emoji: '🔪', name: 'Маньяки' },
  racer: { emoji: '⚡️', name: 'Гонщики' },
  profi: { emoji: '💼', name: 'Профи' },
  driver: { emoji: '🚖', name: 'Таксисты' },
  amateur: { emoji: '🍆', name: 'Любители' },
  newbie: { emoji: '🐥', name: 'Новички' }
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
        counts.push(`[${rankData[rank].emoji}] ${rankData[rank].name} ${count}`);
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
