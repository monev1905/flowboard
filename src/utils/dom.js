export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue
    if (key === 'class') node.className = value
    else if (key === 'dataset') Object.assign(node.dataset, value)
    else if (key === 'style' && typeof value === 'object') Object.assign(node.style, value)
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value)
    } else if (key === 'html') {
      node.innerHTML = value
    } else if (key in node) {
      try { node[key] = value } catch { node.setAttribute(key, value) }
    } else {
      node.setAttribute(key, value)
    }
  }
  appendChildren(node, children)
  return node
}

function appendChildren(node, children) {
  if (children == null || children === false) return
  if (Array.isArray(children)) {
    children.forEach((c) => appendChildren(node, c))
  } else if (children instanceof Node) {
    node.appendChild(children)
  } else {
    node.appendChild(document.createTextNode(String(children)))
  }
}

export function mount(parent, ...nodes) {
  parent.replaceChildren(...nodes.filter(Boolean))
}

export function clear(node) {
  if (node) node.replaceChildren()
}

export function delegate(root, selector, event, handler) {
  root.addEventListener(event, (e) => {
    const target = e.target.closest(selector)
    if (target && root.contains(target)) handler(e, target)
  })
}
