import {
  elt,
  getUniqueId,
  extractFootnoteName,
  formatNumber,
} from './utils.js';

const pkgName = 'Padatika';

const defaultJumpTexts = {
  jumpUp: 'Jump up',
  jumpBackUp: 'Jump back up',
  jumpUpTo: 'Jump up to: ',
};

interface Options {
  numberFormat?: string | ((n: number) => string);
  dataAttributePostfix?: string;
  enableBacklinks?: boolean;
  backlinkPos?: 'start' | 'end';
  backlinkSymbol?: string;
  jumpTexts?: {
    jumpUp?: string;
    jumpBackUp?: string;
    jumpUpTo?: string;
  };
  getBacklinkIdentifier?: (n: number) => string;
  getListStyleTypeStr?: (n: string) => string;
  ignoreIndicatorOfFirstCategory?: boolean;
  ignoreIndicatorOfCategory?: string;
  enableBrackets?: boolean;
  sep?: string;
  targetedBacklinkClassName?: string;
  backlinksWrapperClassName?: string;
}

const defaultOptions: Options = {
  numberFormat: 'latn',
  dataAttributePostfix: 'fnref',
  enableBacklinks: true,
  backlinkPos: 'start',
  backlinkSymbol: '↑',
  jumpTexts: defaultJumpTexts,
  ignoreIndicatorOfFirstCategory: true,
  enableBrackets: true,
  sep: '&nbsp;',
  targetedBacklinkClassName: 'targeted-backlink',
  backlinksWrapperClassName: 'backlinks-wrapper',
};

export default function initPadatika(
  categoryIdToCategoryIndicatorMap: {
    [x: string]: string;
  },
  {
    numberFormat = 'latn',
    dataAttributePostfix = 'fnref',
    enableBacklinks = true,
    backlinkPos = 'start',
    backlinkSymbol = '↑',
    jumpTexts = defaultJumpTexts,
    getBacklinkIdentifier,
    getListStyleTypeStr,
    ignoreIndicatorOfFirstCategory = true,
    ignoreIndicatorOfCategory,
    enableBrackets = true,
    sep = '&nbsp;',
    targetedBacklinkClassName = 'targeted-backlink',
    backlinksWrapperClassName = 'backlinks-wrapper',
  }: Options = defaultOptions,
) {
  if (getBacklinkIdentifier === undefined) {
    getBacklinkIdentifier = (n: number) => {
      return formatNumber(n + 1, numberFormat);
    };
  }

  if (getListStyleTypeStr === undefined) {
    getListStyleTypeStr = (n: string) => {
      return `${n}. `;
    };
  }

  jumpTexts = { ...defaultJumpTexts, ...jumpTexts };

  const addressToInfoMap: {
    [x: string]: {
      li: HTMLLIElement;
      backlinksWrapper: HTMLSpanElement;
      refs: HTMLAnchorElement[]; // It is important backlinks and handling uniqueRefCount
      indexLocaleStr: string;
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
        const name = extractFootnoteName(li);
        if (name != '') {
          const address = `${categoryId}:${name}`;
          if (!addressToInfoMap[address]) {
            const backlinksWrapper = elt(
              'span',
              backlinksWrapperClassName,
            ) as HTMLSpanElement;

            li.id = getUniqueId(`fn-${address}`);

            addressToInfoMap[address] = {
              li,
              backlinksWrapper: backlinksWrapper,
              refs: [],
              indexLocaleStr: '',
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
                backlinksWrapper.insertAdjacentText('afterend', ' ');
              }
            }
          } else {
            console.warn(
              `${pkgName}: Footnote ignored for duplicate name(${name}) in category(${categoryId}).`,
            );
            lisToRemove.push(li); // for not collect sups from here
          }
        } else {
          console.warn(
            `${pkgName}: Footnote lacks a name or has invalid one: ${li.textContent}`,
          );
          lisToRemove.push(li); // for not collect sups from here
        }
      }
    }
  }

  const firstCategoryId =
    categoryIdsQueryString != ''
      ? document.querySelector(categoryIdsQueryString)!.id
      : null;

  lisToRemove.forEach((li) => li.remove());

  const sups = [
    ...document.querySelectorAll(`[data-${dataAttributePostfix}]`),
  ] as HTMLElement[];
  if (sups.length == 0) return;

  ulsToRemove.forEach((ul) => ul.remove());

  sups.forEach((sup) => {
    const regex = /^([\w-]+):([\w-]+)$/;
    const match = (sup.textContent as string).trim().match(regex);

    const anchor = elt('a') as HTMLAnchorElement;
    const renderAnchor = (err: boolean, innerHTML: string, href?: string) => {
      sup.replaceChildren(anchor);
      anchor.innerHTML = enableBrackets ? `[${innerHTML}]` : innerHTML;
      if (href) anchor.href = href;
      if (err) anchor.style.color = 'red';
    };

    if (match) {
      const footnoteName = match[2];
      const categoryId = match[1];

      const heading = categoryIdToHeadingMap[categoryId];
      const categoryIndicator = categoryIdToCategoryIndicatorMap[categoryId];
      let categoryIndicatorFormatted = categoryIndicator + sep;

      if (ignoreIndicatorOfFirstCategory && !ignoreIndicatorOfCategory) {
        if (categoryId === firstCategoryId) categoryIndicatorFormatted = '';
      } else if (ignoreIndicatorOfCategory) {
        // note that if both options are true, this overrides ignoreIndicatorOfFirstCategory
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
            const backlinksWrapper = addressInfo.backlinksWrapper;
            const targetedBacklink =
              backlinksWrapper.querySelector<HTMLAnchorElement>(
                `[href="#${anchor.id}"]`,
              )!;

            if (addressInfo.refs.length > 1) {
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
              backlink.title = jumpTexts.jumpBackUp!;
              backlink.ariaLabel = jumpTexts.jumpBackUp!;
              backlink.addEventListener('click', cleanupFunc);

              const backlinkSymbolTextNode =
                backlinksWrapper.firstChild! as Text;
              backlinkSymbolTextNode.replaceWith(backlink);
            } else {
              targetedBacklink.title = jumpTexts.jumpBackUp!;
              targetedBacklink.ariaLabel = jumpTexts.jumpBackUp!;
              cleanupFunc = () => {
                if (cleanupNeeded) {
                  targetedBacklink.title = jumpTexts.jumpUp!;
                  targetedBacklink.ariaLabel = jumpTexts.jumpUp!;
                  cleanupNeeded = false;
                }
              };
            }
            cleanupNeeded = true;
          });

          sup.insertAdjacentHTML('beforebegin', '&NoBreak;');

          if (categoryIdToRefInfo[categoryId]) {
            if (addressInfo.refs.length === 1) {
              // i.e. if number of backlinks is 1
              const info = categoryIdToRefInfo[categoryId];
              info.uniqueRefCount++;
              addressInfo.indexLocaleStr = formatNumber(
                info.uniqueRefCount,
                numberFormat,
              );
              li.style.listStyleType = `"${getListStyleTypeStr(
                addressInfo.indexLocaleStr,
              )}"`;
              info.parentOL.append(li);
            }
            renderAnchor(
              false,
              `${categoryIndicatorFormatted}${addressInfo.indexLocaleStr}`,
              `#${li.id}`,
            );
          } else {
            addressInfo.indexLocaleStr = formatNumber(1, numberFormat);
            const ol = elt('ol') as HTMLOListElement;
            li.style.listStyleType = `"${getListStyleTypeStr(addressInfo.indexLocaleStr)}"`;
            ol.append(li);
            categoryIdToRefInfo[categoryId] = {
              uniqueRefCount: 1,
              parentOL: ol,
            };
            renderAnchor(
              false,
              `${categoryIndicatorFormatted}${addressInfo.indexLocaleStr}`,
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

  Object.entries(addressToInfoMap).forEach(([address, info]) => {
    const refsCount = info.refs.length;
    const backlinksWrapper = info.backlinksWrapper;

    if (refsCount == 0) {
      console.warn(`${pkgName}: Footnote("${address}") lacks references.`);
      const ref = info.li.querySelector(`[data-${dataAttributePostfix}]`);
      if (ref) {
        console.error(
          `${pkgName}: Reference from orphan footnote(${address}) exists!`,
        );
      }
    } else {
      if (enableBacklinks) {
        if (refsCount == 1) {
          const backlink = elt('a') as HTMLAnchorElement;
          backlink.textContent = backlinkSymbol;
          backlink.href = `#${info.refs[0].id}`;
          backlink.title = jumpTexts.jumpUp!;
          backlink.ariaLabel = jumpTexts.jumpUp!;
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

            if (i == 0) {
              const accessibilityLabelElt = elt('span');
              accessibilityLabelElt.textContent = jumpTexts.jumpUpTo!;
              accessibilityLabelElt.setAttribute(
                'style',
                `top: -99999px; clip: rect(1px,1px,1px,1px); position: absolute !important; padding: 0 !important; border: 0 !important; height: 1px !important; width: 1px !important; overflow: hidden;`,
              );
              backlink.prepend(accessibilityLabelElt);
            }
          });
        }
      }
    }
  });
}
