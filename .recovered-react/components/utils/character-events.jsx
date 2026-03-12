export const protegoOptions = (player, currentOptions) => {
  let tableau = [],
    popupOptions = [...currentOptions];

  if (popupOptions.length > 2) return popupOptions;

  for (let i = 0; i < player.tableau.length; i++) {
    tableau.push(player.tableau[i].name);
  }

  if (player.power.includes("mundungus_fletcher"))
    popupOptions.push({
      label: "Try to hide as Mundungus",
      function: "houseHide",
    });

  if (tableau.includes("vanishing_cabinet"))
    popupOptions.push({
      label: "Try to hide in your vanishing cabinet!",
      function: "houseHide",
    });

  if (tableau.includes("invisibility_cloak"))
    popupOptions.push({
      label: "Try to hide with your invisibility cloak!",
      function: "invisibilityHide",
    });

  if (
    tableau.includes("vanishing_cabinet") &&
    tableau.includes("invisibility_cloak")
  )
    popupOptions = [
      {
        label: "Hide, invisible, in your vanishing cabinet.",
        function: "clearEvent",
      },
    ];

  return popupOptions;
};
