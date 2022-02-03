class Elements {

    constructor(children = null) {
        this.init(children)
        this.attrList = {
            "rounded": {
                "false": "elements_rounded_false",
            },

            "background": {
                "green": "elements_background_green",
                "yellow": "elements_background_yellowÒ",
                "purple": "elements_background_purple",
                "purple_light": "elements_background_purple_light",
            },

            "color": {
                "green": "elements_color_green",
                "yellow": "elements_color_yellowÒ",
                "purple": "elements_color_purple",
                "purple_light": "elements_color_purple_light",
            },

            "layout_flex": {
                "vertical": "elements_layout_flex_vertical"
            },

            "height": {
                "full": "height_full",
            },

            "width": {
                "full": "width_full",
            },

            "justify": {
                "center": "layout_flex_justify_center",
                "between": "layout_flex_justify_between",
                "around": "layout_flex_justify_around",
                "evenly": "layout_flex_justify_evenly",
            },

            "align": {
                "top": "layout_flex_align_top",
                "center": "layout_flex_align_center",
                "bottom": "layout_flex_align_bottom",
            },

            "text": {
                "left": "text_align_left",
                "center": "text_align_center",
                "right": "text_align_right",
            }
        }
    }

    init(children) {
        if (children) {
            this.children = children

            if (Array.isArray(children)) {
                for (let child of children) {
                    this[child.constructor.name] = child

                    // if (child.elem.id) {
                    //     //this[child.elem.id] = child
                    // }
                }
            } else {
                this[children.constructor.name] = children

                // if (children.elem.id) {
                //     // this[children.elem.id] = child
                //     // this.id = 
                // }
            }
        }
    }

    select(selector) {
        let prefix = selector[0]
        let id = selector.slice(1)

        switch (prefix) {
            case ".":
                return this.recursiveSearch(this, "class", id)
                break;

            case "#":
                return this.recursiveSearch(this, "id", id)
                break
        }
    }

    recursiveSearch(element, selector, id) {
        var node;

        if (element.elem[selector] == id || element.elem.classList.contains(id)) {
            return element;
        }

        if (Array.isArray(element.children)) {
            element.children.some(child => node = this.recursiveSearch(child, selector, id));
        } else {
            if (element.children) {
                return this.recursiveSearch(element.children, selector, id)
            }
        }

        return node;
    }

    selectAll(selector) {
        let prefix = selector[0]
        let id = selector.slice(1)

        switch (prefix) {
            case ".":
                return this.recursiveSearchAll(this, "class", id, [])
                break;

            case "#":
                return this.recursiveSearchAll(this, "id", id, [])
                break
        }
    }

    recursiveSearchAll(element, selector, id, array) {
        var node;

        if (element.elem[selector] == id || element.elem.classList.contains(id)) {
            array.push(element)
        }

        if (Array.isArray(element.children)) {
            element.children.some((child) => {
                node = this.recursiveSearchAll(child, selector, id, array)
            });
        } else {
            if (element.children) {
                return this.recursiveSearchAll(element.children, selector, id, array)
            } else {
                return node
            }

        }

        return array;
    }

    remove() {
        this.elem.remove()
    }

    setAttributes(elem, attr) {
        if (attr == null)
            return

        for (const [key, value] of Object.entries(attr)) {
            if (this.attrList[key] && this.attrList[key][value])  {
                elem.classList.add(this.attrList[key][value])
            } else {
                switch (key) {
                    case "class":
                        let splitClass = value.split(' ');
                        if (splitClass.length > 1) {
                            for (let c of splitClass) {
                                elem.classList.add(c)
                            }
                        } else {
                            elem.classList.add(value)
                        }
                        break;

                    default:
                        elem.setAttribute(key, value)
                        break;
                }
            }
        }
    }

    initEl(el, children, attr) {
        let elem = document.createElement(el)
        if (children)
            this.setChildren(elem, children)
        this.setAttributes(elem, attr)
        return elem
    }

    initText(el, text, attr) {
        let elem = document.createElement(el)
        elem.innerText = text
        this.setAttributes(elem, attr)
        return elem
    }

    setChildren(elem, children) {
        if (children == null)
            return

        if (Array.isArray(children)) {
            for (let child of children) {
                elem.appendChild(child.elem)
            }
        } else {
            elem.appendChild(children.elem)
        }
    }

    appendChild(child) {
        this.elem.appendChild(child.elem)
    }

    classAdd(className) {
        this.elem.classList.add(className)
    }

    classRemove(className) {
        this.elem.classList.remove(className)
    }

    classToggle(className) {
        this.elem.classList.toggle(className)
    }

    onClick(fct) {
        this.elem.addEventListener('click', fct)
    }

    getAttribute(value) {
        return this.elem.getAttribute(value)
    }

}

// CONATINERS

class Container extends Elements {
    constructor(children, attr = null) {
        super(children)
        this.elem = this.initEl("div", children, attr)
    }
}

class Section extends Elements {
    constructor(children, attr = null) {
        super(children)
        this.elem = this.initEl("section", children, attr)
    }
}

class Header extends Elements {
    constructor(children, attr = null) {
        super(children)
        this.elem = this.initEl("div", children, attr)
        this.elem.classList.add('header')
    }
}

class Canvas extends Elements {
    constructor(children, attr = null) {
        super(children)
        this.elem = this.initEl("canvas", children, attr)
        this.elem.classList.add('canvasBackground')
        this.elem.height = "1280";
        this.elem.width = "1080";
    }
}

class Img extends Elements {
    constructor(src, attr = null) {
        super()
        this.elem = this.initEl("img", null, attr)
        this.elem.src = src
    }
}


class UL extends Elements {
    constructor(children, attr = null) {
        super(children)
        this.elem = this.initEl("ul", children, attr)
    }
}

class LI extends Elements {
    constructor(children, attr = null) {
        super(children)
        this.elem = this.initEl("li", children, attr)
    }
}

class Center extends Elements {
    constructor(children, x = true, y = true, attr = null) {
        super(children)
        this.elem = this.initEl("div", children, attr)
        if (x && y) {
            this.elem.classList.add('elements_center')
        } else {
            if (x)
                this.elem.classList.add('elements_center_x')
            if (y)
                this.elem.classList.add('elements_center_y')
        }
    }
}

class LayoutVertical extends Elements {
    constructor(children, attr = null) {
        super(children)
        this.elem = this.initEl("div", children, attr)
        this.elem.classList.add('elements_layout_flex_vertical')
    }
}

class LayoutHorizontal extends Elements {
    constructor(children, attr = null) {
        super(children)
        this.elem = this.initEl("div", children, attr)
        this.elem.classList.add('elements_layout_flex_horizontal')
    }
}

// ELEMENTS

class Input extends Elements {
    constructor(attr = null) {
        super()
        this.elem = this.initEl("input", null, attr)
    }

    onKeyup(fct) {
        this.elem.addEventListener('keyup', fct)
    }
}

class Button extends Elements {
    constructor(text, attr = null) {
        super()
        this.elem = this.initText("button", text, attr)
    }

    disabled(bool) {
        this.elem.disabled = bool
    }
}

class MultipleChoice extends Elements {
    constructor(children, attr = null) {
        super()
        this.elem = this.initEl("div", children, attr)
        this.elem.classList.add('multipleChoice')
        this.children = children
        this.initButtons()
    }

    initButtons() {
        this.children[0].elem.disabled = true
        this.selected = this.children[0].value

        for (let choice of this.children) {
            choice.elem.addEventListener('click', () => {
                for (let c of this.children) {
                    c.elem.disabled = false
                }
                choice.elem.disabled = true
                this.selected = choice.value
            })
        }
    }
}

class Choice extends Elements {
    constructor(text, value, attr = null) {
        super()
        this.value = value
        this.elem = this.initText("button", text, attr)
        this.elem.classList.add('choice')
    }
}

// Text

class H1 extends Elements {
    constructor(text, attr = null) {
        super()
        this.elem = this.initText("h1", text, attr)
        this.elem.classList.add('title')
    }
}

class H2 extends Elements {
    constructor(text, attr = null) {
        super()
        this.elem = this.initText("h2", text, attr)
    }
}

class H3 extends Elements {
    constructor(text, attr = null) {
        super()
        this.elem = this.initText("h3", text, attr)
    }
}

class H4 extends Elements {
    constructor(text, attr = null) {
        super()
        this.elem = this.initText("h4", text, attr)
    }
}

class Text extends Elements {
    constructor(text, attr = null) {
        super()
        this.elem = this.initText("span", text, attr)
        this.elem.classList.add('text')
    }
}

class Span extends Elements {
    constructor(text, attr = null) {
        super()
        this.elem = this.initText("span", text, attr)
    }
}

class P extends Elements {
    constructor(text, attr = null) {
        super()
        this.elem = this.initText("p", text, attr)
    }
}