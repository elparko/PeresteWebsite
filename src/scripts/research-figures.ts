function place(fig: HTMLElement, tip: HTMLElement, x: number, y: number) {
  const box = fig.getBoundingClientRect();
  const left = x - box.left;
  const top = y - box.top;
  tip.hidden = false;
  const flip = left > box.width * 0.55;
  tip.style.top = `${top + 14}px`;
  tip.style.left = flip ? "" : `${Math.max(8, left + 14)}px`;
  tip.style.right = flip ? `${Math.max(8, box.width - left + 14)}px` : "";
}

function bindTips(fig: HTMLElement) {
  const tip = fig.querySelector<HTMLElement>(".rfig-tip");
  if (!tip) return;
  const hide = () => (tip.hidden = true);
  const target = (e: Event) => (e.target as HTMLElement).closest<HTMLElement>("[data-tip]");

  fig.addEventListener("pointermove", (e) => {
    const el = target(e);
    if (!el) return hide();
    tip.textContent = el.dataset.tip ?? "";
    place(fig, tip, e.clientX, e.clientY);
  });
  fig.addEventListener("pointerleave", hide);
  fig.addEventListener("focusin", (e) => {
    const el = target(e);
    if (!el) return;
    const r = el.getBoundingClientRect();
    tip.textContent = el.dataset.tip ?? "";
    place(fig, tip, r.left + r.width / 2, r.top + r.height / 2);
  });
  fig.addEventListener("focusout", hide);
  fig.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hide();
  });
}

function bindTabs(fig: HTMLElement) {
  fig.querySelectorAll<HTMLElement>("[data-tabset]").forEach((set) => {
    const buttons = set.querySelectorAll<HTMLButtonElement>("[data-tab]");
    const panels = set.querySelectorAll<HTMLElement>("[data-panel]");
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.dataset.tab;
        buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
        panels.forEach((p) => (p.hidden = p.dataset.panel !== key));
      });
    });
  });
}

document.querySelectorAll<HTMLElement>("[data-rfig]").forEach((fig) => {
  bindTips(fig);
  bindTabs(fig);
});
