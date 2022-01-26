document.addEventListener('DOMContentLoaded', () => {
    var tabGameButton = document.querySelector('.titleGame')
    var tabConfButton = document.querySelector('.titleConf')

    var tabGame = document.querySelector('.borderContainerTab')
    var tabConf = document.querySelector('.borderContainerTabConf')

    var canvasBackground = document.querySelector('.canvasBackground')

    tabGameButton.addEventListener('click', () => {
        tabGame.classList.remove('none')
        tabConf.classList.add('none')

        tabGameButton.classList.remove('darkGreenTabs')
        tabConfButton.classList.add('darkBlueTabs')
    })

    tabConfButton.addEventListener('click', () => {
        tabConf.classList.remove('none')
        tabGame.classList.add('none')

        tabConfButton.classList.remove('darkBlueTabs')
        tabGameButton.classList.add('darkGreenTabs')
    })

    var ctx = canvasBackground.getContext('2d')

    var arrayIMG = []

    arrayIMG.push(["/avatar/burger.png", -200, -200])
    const AVATARS = [
        "/avatar/burger.png",
        "/avatar/donut.png",
        "/avatar/pizza.png"
    ]

    function createImg(timestanp) {
        ctx.clearRect(0,0,10000,10000)
        
        for(let img of arrayIMG) {
            
            let imgParse = getImage(img)
  
            ctx.drawImage(imgParse, img[1], img[2], 150, 150);
            img[2] = img[2] + 1

            if(img[2] == 0) {
                arrayIMG.push([AVATARS[getRndInteger(0,AVATARS.length)], getRndInteger(0, canvasBackground.width - 200), -200])
            }

            if(img[2] > canvasBackground.height) {
                let index = arrayIMG.indexOf(img);
                if (index > -1) {
                    arrayIMG.splice(index, 1);
                }
            }
          }

        window.requestAnimationFrame(createImg);
    }
    //window.requestAnimationFrame(createImg);

    function getImage(img) {
        let imgParse = new Image();
        imgParse.src = img[0];
        return imgParse
    }

    function getRndInteger(min, max) {
        return Math.floor(Math.random() * (max - min) ) + min;
    }

})