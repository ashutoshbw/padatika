import { elt, getUniqueId, extractPadatikaName } from "./utils.js";

interface Options {
  locale?: string;
  backlinkPos?: "start" | "end";
  backlinkSymbol?: string;
  getBacklinkIdentifier?: (n: number) => string;
}

const defaultOptions: Options = {
  locale: "en-US",
  backlinkPos: "start",
  backlinkSymbol: "↑",
};

export default function initPadatika(
  idToInitialMap: {
    [x: string]: string;
  },
  {
    locale = "en-US",
    backlinkPos = "start",
    backlinkSymbol = "↑",
    getBacklinkIdentifier,
  }: Options = defaultOptions,
) {
  if (getBacklinkIdentifier == undefined) {
    getBacklinkIdentifier = (n: number) => {
      return (n + 1).toLocaleString(locale, { useGrouping: false });
    };
  }

  // TODO: Validate idToInitialMap

  const addressToInfoMap: {
    [x: string]: {
      li: HTMLLIElement;
      backlinksWrapper: HTMLSpanElement;
      refs: HTMLAnchorElement[]; // It is important backlinks and handling uniqueRefCount
      refsNum: number;
    };
  } = {};

  const idToHeadingMap: {
    [x: string]: HTMLHeadingElement;
  } = {};

  const idToRefInfo: {
    [x: string]: {
      uniqueRefCount: number;
      parentOL: HTMLOListElement;
    };
  } = {};

  let cleanupFunc = () => {};
  let cleanupNeeded = false;

  for (const [id, initial] of Object.entries(idToInitialMap)) {
    const heading = document.querySelector<HTMLHeadingElement>(`#${id}`);

    if (!heading) {
      console.error(`Padatika error: Heading with id ${id} doesn't exist`);
      continue;
    }

    idToHeadingMap[id] = heading;

    const ul =
      heading?.nextElementSibling?.tagName == "UL" &&
      (heading.nextElementSibling as HTMLUListElement);

    if (ul) {
      ul.remove();
      for (let i = 0; i < ul.children.length; i++) {
        const li = ul.children[i] as HTMLLIElement;
        const name = extractPadatikaName(li);
        if (name != "") {
          const address = `${id}:${name}`;
          if (!addressToInfoMap[address]) {
            const backlinksWrapper = elt(
              "span",
              "backlink-wrapper",
            ) as HTMLSpanElement;

            li.id = getUniqueId(`padatika-${address}`);

            addressToInfoMap[address] = {
              li,
              backlinksWrapper: backlinksWrapper,
              refs: [],
              refsNum: 0,
            };

            if (backlinkPos == "end") {
              if (li.lastElementChild?.tagName == "P") {
                const p = li.lastElementChild as HTMLParagraphElement;
                const node = p.nextSibling;
                if (
                  node?.nodeType === Node.TEXT_NODE &&
                  (node as Text).wholeText.trim() != ""
                ) {
                  li.append(backlinksWrapper);
                } else {
                  p.append(backlinksWrapper);
                }
              } else {
                li.append(backlinksWrapper);
              }
            } else if (backlinkPos == "start") {
              if (li.firstElementChild?.tagName == "P") {
                const p = li.firstElementChild as HTMLParagraphElement;
                const node = p.previousSibling;
                if (
                  node?.nodeType === Node.TEXT_NODE &&
                  (node as Text).wholeText.trim() != ""
                ) {
                  li.prepend(backlinksWrapper);
                } else {
                  p.prepend(backlinksWrapper);
                }
              } else {
                li.prepend(backlinksWrapper);
              }
            }
          } else {
            console.warn(
              `Footnote ignored for duplicate name(${name}) in same category(${id}): ${li.textContent}`,
            );
          }
        } else {
          console.warn(`Footnote lacks a name: ${li.textContent}`);
        }
      }
    }
  }

  const sups = [
    ...document.querySelectorAll("[data-padatika]"),
  ] as HTMLElement[];
  if (sups.length == 0) return;

  const defaultId = Object.entries(idToInitialMap).find(
    (entry) => entry[1] === "",
  )?.[0];

  sups.forEach((sup) => {
    const regex = /^(([\w-]+):)?([\w-]+)?$/;
    const match = (sup.textContent as string).trim().match(regex);

    const anchor = elt("a") as HTMLAnchorElement;
    const renderAnchor = (err: boolean, content: string, href?: string) => {
      sup.replaceChildren(anchor);
      anchor.textContent = `[${content}]`;
      if (href) anchor.href = href;
      if (err) anchor.style.color = "red";
      sup.removeAttribute("data-padatika");
    };

    if (match) {
      const name = match[3];
      const id = match[2] || defaultId;

      if (id === undefined) {
        renderAnchor(true, "No default Category exists");
      } else {
        const heading = idToHeadingMap[id];
        const categoryAlias = idToInitialMap[id];
        const categoryAliasFormatted = categoryAlias ? categoryAlias + " " : "";
        if (heading) {
          const li = addressToInfoMap[`${id}:${name}`]?.li; // the optional chain is important
          if (li) {
            const addressInfo = addressToInfoMap[`${id}:${name}`];
            addressInfo.refs.push(anchor);
            anchor.id = getUniqueId(`${li.id}-ref-${addressInfo.refs.length}`);
            anchor.addEventListener("click", () => {
              cleanupFunc();
              if (addressInfo.refs.length > 1) {
                const backlinksWrapper = addressInfo.backlinksWrapper;
                const targetedBacklink =
                  backlinksWrapper.querySelector<HTMLAnchorElement>(
                    `[href="#${anchor.id}"]`,
                  )!;
                const targetedBacklinkClassName = "padatika-targeted-backlink";

                cleanupFunc = () => {
                  if (cleanupNeeded) {
                    targetedBacklink.classList.remove(
                      targetedBacklinkClassName,
                    );
                    backlinksWrapper.firstChild!.replaceWith(backlinkSymbol);
                    cleanupNeeded = false;
                  }
                };

                targetedBacklink.classList.add(targetedBacklinkClassName);

                const backlink = elt("a") as HTMLAnchorElement;
                backlink.textContent = backlinkSymbol;
                backlink.href = targetedBacklink.href;
                backlink.addEventListener("click", cleanupFunc);

                const backlinkSymbolTextNode =
                  backlinksWrapper.firstChild! as Text;
                backlinkSymbolTextNode.replaceWith(backlink);

                cleanupNeeded = true;
              }
            });
            if (idToRefInfo[id]) {
              if (addressInfo.refs.length === 1) {
                const info = idToRefInfo[id];
                info.parentOL.append(li);
                info.uniqueRefCount++;
                addressInfo.refsNum = info.uniqueRefCount;
              }
              renderAnchor(
                false,
                `${categoryAliasFormatted}${addressInfo.refsNum}`,
                `#${li.id}`,
              );
            } else {
              const ol = elt("ol") as HTMLOListElement;
              ol.append(li);
              idToRefInfo[id] = {
                uniqueRefCount: 1,
                parentOL: ol,
              };
              addressInfo.refsNum = 1;
              renderAnchor(false, `${categoryAliasFormatted}${1}`, `#${li.id}`);
              heading.insertAdjacentElement("afterend", ol);
            }
          } else {
            renderAnchor(true, "Target not found");
          }
        } else {
          renderAnchor(true, "Category not matched");
        }
      }
    } else {
      renderAnchor(true, "Invalid ref syntax");
    }
  });

  Object.entries(addressToInfoMap).forEach(([address, info]) => {
    const refsCount = info.refs.length;
    const backlinksWrapper = info.backlinksWrapper;

    if (refsCount == 0) {
      console.warn(`Footnote of identifier "${address}" have no references.`);
    } else if (refsCount == 1) {
      const backlink = elt("a") as HTMLAnchorElement;
      backlink.textContent = backlinkSymbol;
      backlink.href = `#${info.refs[0].id}`;
      backlinksWrapper.append(backlink);
      backlink.addEventListener("click", () => cleanupFunc());
    } else {
      backlinksWrapper.append(backlinkSymbol);
      info.refs.forEach((ref, i) => {
        const backlink = elt("a") as HTMLAnchorElement;
        const sup = elt("sup") as HTMLElement;
        sup.append(backlink);
        backlinksWrapper.append(sup);

        backlink.href = `#${ref.id}`;
        backlink.textContent = getBacklinkIdentifier!(i);
        backlink.addEventListener("click", () => cleanupFunc());
      });
    }
  });
}
