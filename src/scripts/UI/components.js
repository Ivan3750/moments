




const ConnectComponent = (component, placeURL) =>{
    fetch(`../../components/${component}/${component}.html`)
    .then(res => res.text())
    .then(data=>{
        document.querySelector(placeURL).innerHTML = data

    })
}


ConnectComponent("controls",".section__controls")
ConnectComponent("controlsMobil",".section__controls-mobil")
ConnectComponent("header",".header")