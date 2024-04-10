export function elt(name: string, className?: string) {
  const e = document.createElement(name);
  if (className) e.className = className;
  return e;
}

export function getUniqueId(startString: string) {
  let id = startString;
  let count = 0;
  while (document.getElementById(id)) {
    id = `${startString}-${count++}`;
  }
  return id;
}

export function formatNumber(
  n: number,
  format: string | ((n: number) => string),
): string {
  if (typeof format == 'string') {
    return n.toLocaleString(`en-u-nu-${format}`, { useGrouping: false });
  } else {
    return format(n);
  }
}

export function extractFootnoteName(elt: Element) {
  let nonSpaceTextFound = false;
  let name = '';
  function process(elt: Element) {
    if (nonSpaceTextFound) return;
    const childNodes = elt.childNodes;
    for (let i = 0; i < childNodes.length; i++) {
      if (nonSpaceTextFound) return;
      const node = childNodes[i];
      if (node.nodeType === Node.TEXT_NODE) {
        const text = (node as Text).data.trim();
        if (text.length != 0) {
          nonSpaceTextFound = true;
          const nameRegex = /^\[([\w-]+)\]\s*/;
          const match = text.match(nameRegex);
          if (match) {
            name = match[1];
            (node as Text).data = (node as Text).data.replace(nameRegex, '');
          }
          return;
        } else {
          continue;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        process(node as Element);
      } else {
        continue;
      }
    }
  }
  process(elt);
  return name;
}
