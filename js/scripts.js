function el(el) {
    if (el.charAt(0) === "#") {
        return document.getElementById(el.slice(1));
    }
    return document.querySelectorAll(el);
}

(function(){

    "use strict";

    var btnToEditor = el('#toEditor'),
        header = el('#header'),
        headerImg = el('.header-img')[0],
        editorSidebar = el("#editorSidebar"),
        effectsWrapper = el('.effects-wrapper'),
        button;

    var togglePanel = function() {
        var arrow = document.querySelectorAll('.arrow-small');
        for(var i = 0, l = effectsWrapper.length; i < l; i++) {
            effectsWrapper[i].classList.toggle("hidden");
            arrow[i].classList.toggle('arrow-down');
        }
    };

var scrollBoxes = function(button) {

    // Form box to scroll
    var buttonTarget = button.dataset.up || button.dataset.down,
        parent = el('#'+buttonTarget),
        effectBox = parent.querySelectorAll('.effect-preview'),

    // Other button
        buttons = button.parentNode.querySelectorAll('.btn-scroll'),
        otherButton,

    // Scroll
        maximumScroll = false,
        scrollAmount = parseInt(parent.dataset.scroll),
        value,

    // All the heights
        eBoxHeight = effectBox[1].offsetHeight,
        totalBoxHeight = eBoxHeight * effectBox.length + ((effectBox[0].offsetHeight - eBoxHeight) * 1.5),
        boxFix = (totalBoxHeight - parent.offsetHeight) + 12,
        reset;

    if (button === buttons[1]) {
        otherButton = buttons[0];
    } else {
        otherButton = buttons[1];
    }

    if(button.dataset.up) {
        scrollAmount -= eBoxHeight * 1.5; //up
        reset = scrollAmount <= eBoxHeight;
        value = 0;
    } else {
        scrollAmount += eBoxHeight * 1.5; // down
        reset = scrollAmount > boxFix;
        value = boxFix;
    }

    if(reset) {
        scrollAmount = value;
        maximumScroll = true;

        if (maximumScroll === true) {
            button.setAttribute("disabled","disabled");
        }
    } else {
        maximumScroll = false;
        otherButton.removeAttribute("disabled");
    }

    for (var i = 0, l = effectBox.length; i < l; i++) {
        effectBox[i].style.transform = "translate3d(0 ,-" + scrollAmount + "px ,0)";
    }

    parent.dataset.scroll = scrollAmount;
};

    btnToEditor.addEventListener('click',function(e){
        header.classList.add('hidden');
        headerImg.classList.add('hidden');
        e.preventDefault();
    },true);

    editorSidebar.addEventListener('click',function(e) {
        var child = e.target.classList,
        parent = e.target.parentNode.classList;

        if(child.contains('btn-collapse') || parent.contains('btn-collapse')) {
            togglePanel();
        }

        if(parent.contains('btn-scroll')) {
            button = e.target.parentNode;
            scrollBoxes(button);
        } else if (child.contains('btn-scroll')) {
            button = e.target;
            scrollBoxes(button);
        }

    });

}())