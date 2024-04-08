import { elt, getUniqueId, extractPadatikaName } from './utils.js';

interface Options {
  locale?: string;
  enableBacklinks?: boolean;
  backlinkPos?: 'start' | 'end';
  backlinkSymbol?: string;
  getBacklinkIdentifier?: (n: number) => string;
  ignoreIndicatorOfFirstCategory?: boolean;
  ignoreIndicatorOfCategory?: string;
}

const defaultOptions: Options = {
  locale: 'en-US',
  enableBacklinks: true,
  backlinkPos: 'start',
  backlinkSymbol: '↑',
  ignoreIndicatorOfFirstCategory: true,
};

export default function initPadatika(
  categoryIdToCategoryIndicatorMap: {
    [x: string]: string;
  },
  {
    locale = 'en-US',
    enableBacklinks = true,
    backlinkPos = 'start',
    backlinkSymbol = '↑',
    getBacklinkIdentifier,
    ignoreIndicatorOfFirstCategory = true,
    ignoreIndicatorOfCategory,
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

  const categoryIdToHeadingMap: {
    [x: string]: HTMLHeadingElement;
  } = {};

  const categoryIdToRefInfo: {
    [x: string]: {
      uniqueRefCount: number;
      parentOL: HTMLOListElement;
    };
  } = {};

  let cleanupFunc = () => {};
  let cleanupNeeded = false;
  let categoryIdsQueryString = '';
  const ulsToRemove: HTMLUListElement[] = [];
  const lisToRemove: HTMLLIElement[] = [];

  for (const categoryId of Object.keys(categoryIdToCategoryIndicatorMap)) {
    const heading = document.querySelector<HTMLHeadingElement>(
      `#${categoryId}`,
    );

    if (!heading) continue;

    categoryIdsQueryString += `${categoryIdsQueryString == '' ? '' : ' ,'}#${categoryId}`;

    categoryIdToHeadingMap[categoryId] = heading;

    const ul =
      heading?.nextElementSibling?.tagName == 'UL' &&
      (heading.nextElementSibling as HTMLUListElement);

    if (ul) {
      ulsToRemove.push(ul);
      for (let i = 0; i < ul.children.length; i++) {
        const li = ul.children[i] as HTMLLIElement;
        const name = extractPadatikaName(li);
        if (name != '') {
          const address = `${categoryId}:${name}`;
          if (!addressToInfoMap[address]) {
            const backlinksWrapper = elt(
              'span',
              'backlink-wrapper',
            ) as HTMLSpanElement;

            li.id = getUniqueId(`padatika-${address}`);

            addressToInfoMap[address] = {
              li,
              backlinksWrapper: backlinksWrapper,
              refs: [],
              refsNum: 0,
            };

            if (enableBacklinks) {
              if (backlinkPos == 'end') {
                if (li.lastElementChild?.tagName == 'P') {
                  const p = li.lastElementChild as HTMLParagraphElement;
                  const node = p.nextSibling;
                  if (
                    node?.nodeType === Node.TEXT_NODE &&
                    (node as Text).wholeText.trim() != ''
                  ) {
                    li.append(backlinksWrapper);
                  } else {
                    p.append(backlinksWrapper);
                  }
                } else {
                  li.append(backlinksWrapper);
                }
              } else if (backlinkPos == 'start') {
                if (li.firstElementChild?.tagName == 'P') {
                  const p = li.firstElementChild as HTMLParagraphElement;
                  const node = p.previousSibling;
                  if (
                    node?.nodeType === Node.TEXT_NODE &&
                    (node as Text).wholeText.trim() != ''
                  ) {
                    li.prepend(backlinksWrapper);
                  } else {
                    p.prepend(backlinksWrapper);
                  }
                } else {
                  li.prepend(backlinksWrapper);
                }
              }
            }
          } else {
            console.warn(
              `Footnote ignored for duplicate name(${name}) in same category(${categoryId}).`,
            );
            lisToRemove.push(li); // for not collect sups from here
          }
        } else {
          console.warn(
            `Footnote lacks a name or has invalid one: ${li.textContent}`,
          );
          lisToRemove.push(li); // for not collect sups from here
        }
      }
    }
  }

  const firstCategoryId = document.querySelector(categoryIdsQueryString)?.id;

  lisToRemove.forEach((li) => li.remove());

  const sups = [
    ...document.querySelectorAll('[data-padatika]'),
  ] as HTMLElement[];
  if (sups.length == 0) return;

  ulsToRemove.forEach((ul) => ul.remove());

  sups.forEach((sup) => {
    const regex = /^([\w-]+):([\w-]+)$/;
    const match = (sup.textContent as string).trim().match(regex);

    const anchor = elt('a') as HTMLAnchorElement;
    const renderAnchor = (err: boolean, content: string, href?: string) => {
      sup.replaceChildren(anchor);
      anchor.textContent = `[${content}]`;
      if (href) anchor.href = href;
      if (err) anchor.style.color = 'red';
    };

    if (match) {
      const footnoteName = match[2];
      const categoryId = match[1];

      const heading = categoryIdToHeadingMap[categoryId];
      const categoryIndicator = categoryIdToCategoryIndicatorMap[categoryId];
      let categoryIndicatorFormatted = categoryIndicator + ' ';

      if (ignoreIndicatorOfFirstCategory && !ignoreIndicatorOfCategory) {
        if (categoryId === firstCategoryId) categoryIndicatorFormatted = '';
      } else if (ignoreIndicatorOfCategory) {
        if (categoryId === ignoreIndicatorOfCategory)
          categoryIndicatorFormatted = '';
      }

      if (heading) {
        const addressInfo = addressToInfoMap[`${categoryId}:${footnoteName}`];
        const li = addressInfo?.li; // the optional chain is important
        if (li) {
          addressInfo.refs.push(anchor); // The anchor could be for a li that will not be displayed
          anchor.id = getUniqueId(`${li.id}-ref-${addressInfo.refs.length}`);
          anchor.addEventListener('click', () => {
            cleanupFunc();
            if (addressInfo.refs.length > 1) {
              const backlinksWrapper = addressInfo.backlinksWrapper;
              const targetedBacklink =
                backlinksWrapper.querySelector<HTMLAnchorElement>(
                  `[href="#${anchor.id}"]`,
                )!;
              const targetedBacklinkClassName = 'padatika-targeted-backlink';

              cleanupFunc = () => {
                if (cleanupNeeded) {
                  targetedBacklink.classList.remove(targetedBacklinkClassName);
                  backlinksWrapper.firstChild!.replaceWith(backlinkSymbol);
                  cleanupNeeded = false;
                }
              };

              targetedBacklink.classList.add(targetedBacklinkClassName);

              const backlink = elt('a') as HTMLAnchorElement;
              backlink.textContent = backlinkSymbol;
              backlink.href = targetedBacklink.href;
              backlink.addEventListener('click', cleanupFunc);

              const backlinkSymbolTextNode =
                backlinksWrapper.firstChild! as Text;
              backlinkSymbolTextNode.replaceWith(backlink);

              cleanupNeeded = true;
            }
          });

          if (categoryIdToRefInfo[categoryId]) {
            if (addressInfo.refs.length === 1) {
              // i.e. if number of backlinks is 1
              const info = categoryIdToRefInfo[categoryId];
              info.parentOL.append(li);
              info.uniqueRefCount++;
              addressInfo.refsNum = info.uniqueRefCount;
            }
            renderAnchor(
              false,
              `${categoryIndicatorFormatted}${addressInfo.refsNum}`,
              `#${li.id}`,
            );
          } else {
            const ol = elt('ol') as HTMLOListElement;
            ol.append(li);
            categoryIdToRefInfo[categoryId] = {
              uniqueRefCount: 1,
              parentOL: ol,
            };
            addressInfo.refsNum = 1;
            renderAnchor(
              false,
              `${categoryIndicatorFormatted}${1}`,
              `#${li.id}`,
            );
            heading.insertAdjacentElement('afterend', ol);
          }
        } else {
          renderAnchor(true, 'Target not found');
        }
      } else {
        renderAnchor(true, match.input as string);
      }
    } else {
      renderAnchor(true, 'Invalid ref syntax');
    }
  });

  if (enableBacklinks) {
    Object.entries(addressToInfoMap).forEach(([address, info]) => {
      const refsCount = info.refs.length;
      const backlinksWrapper = info.backlinksWrapper;

      if (refsCount == 0) {
        console.warn(`Footnote of address "${address}" have no references.`);
        const ref = info.li.querySelector('[data-padatika]');
        if (ref) {
          console.error(
            `References from orphan footnote(${address}) can have unexpected output!`,
          );
        }
      } else if (refsCount == 1) {
        const backlink = elt('a') as HTMLAnchorElement;
        backlink.textContent = backlinkSymbol;
        backlink.href = `#${info.refs[0].id}`;
        backlinksWrapper.append(backlink);
        backlink.addEventListener('click', () => cleanupFunc());
      } else {
        backlinksWrapper.append(backlinkSymbol);
        info.refs.forEach((ref, i) => {
          const backlink = elt('a') as HTMLAnchorElement;
          const sup = elt('sup') as HTMLElement;
          sup.append(backlink);
          backlinksWrapper.append(sup);

          backlink.href = `#${ref.id}`;
          backlink.textContent = getBacklinkIdentifier!(i);
          backlink.addEventListener('click', () => cleanupFunc());
        });
      }
    });
  }
}
