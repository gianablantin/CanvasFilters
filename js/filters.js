(function canvasFilters() {
    "use strict";

    var btnUpload = el("#canvas-upload"),
        sidebarUpload = el("#sidebar-upload"),
        canvas = el("#canvas"),
        ctx = canvas.getContext("2d"),
        img = new Image(),
        fileName = el('#filename'),
        canvasText = document.querySelector('.upload-text'),
        saveLink = document.querySelector('.btn-download'),
        saveImg,
        chooseFilter = el("#chooseFilter"),
        chooseBorder = el("#chooseBorder"),
        ratio,

        btnWidth = el("#btnWidth"),
        inputWidth = el("#changeWidth"),
        inputHeight = el("#changeHeight");

    // Get image from HTML file input
    function getImage() {
        var fReader = new FileReader(),
            f = this.files[0],
            getFileName = f.name.replace(/\.[^.]+$/,"");

        // Check if image file & size is correct
        if(f.type.match("image/jpeg") || f.type.match("image/png") || f.type.match("image/gif")) {

            fReader.onload = function(e) {
                img.onload = function() {
                    initCanvas(); // Paints the canvas with the image
                    doAllTheThings(); // Brings in all the other features
                };

                img.src = e.target.result; // Set image source from file upload
            };

            fReader.readAsDataURL(f); // Read file upload
            setFileName(getFileName); // Gets the filename, sets the image for download
            canvasText.innerHTML = "Loading, please wait...";

        } else {
            alert("Accepted file types are jpg/jpeg, png, and gif");
        }
    }

    // Convert to blob or Chrome will crash when downloading large file
    // https://stackoverflow.com/questions/6850276/how-to-convert-dataurl-to-file-object-in-javascript
    var dataURLToBlob = function(dataURI) {
        // convert base64 to raw binary data held in a string
        var byteString = atob(dataURI.split(',')[1]);

        // separate out the mime component
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

        // write the bytes of the string to an ArrayBuffer
        var ab = new ArrayBuffer(byteString.length);
        var ia = new Uint8Array(ab);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        var blob = new Blob([ab], { type: mimeString });
        var url = URL.createObjectURL(blob);
        return url;
    }

    // Get the canvas ready
    var initCanvas = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ratio = img.width/img.height;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };

    // Set the file name
    var setFileName = function(getFileName) {
        var measureText,
            textWidth;

        // Set filename on input
        fileName.value = getFileName;

        // Copy value to invisible element, measure
        measureText = el("#measureText");
        measureText.innerHTML = filename.value;
        textWidth = measureText.clientWidth;
        filename.style.width = textWidth + "px";

        saveLink.setAttribute("download",fileName.value + ".jpg");

        filename.addEventListener("input",function(){
            measureText.innerHTML = filename.value;
            textWidth = measureText.clientWidth;
            filename.style.width = textWidth + "px";
            saveLink.setAttribute("download",fileName.value + ".jpg");
        });
    };

    var doAllTheThings = function() {
        var currentFilter,
            currentBorder;

        // Set image size on inputs
        inputWidth.value = img.width;
        inputHeight.value = img.height;

        inputWidth.addEventListener("input",function(){
            inputHeight.value = Math.round(inputWidth.value / ratio);
        },false);

        inputHeight.addEventListener("input",function(){
            inputWidth.value = Math.round(inputHeight.value * ratio);
        },false);

        // Resize
        btnWidth.addEventListener("click", resizeImg, false);

        // Reset to default
        chooseFilter.elements.pickfilter.value = "default";
        chooseBorder.elements.pickborder.value = "default";

        // Set filter
        chooseFilter.addEventListener("change",function(){
            var thisFilter = this.elements.pickfilter.value;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            currentFilter = filters[thisFilter];

            if(thisFilter !== "default") {
                filters[thisFilter]();
            }

            if(currentBorder) {
                currentBorder();
            }
        },false);

        // Set border
        chooseBorder.addEventListener("change",function(){
            var thisBorder = this.elements.pickborder.value;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            if(currentFilter) {
                currentFilter();
            }
            currentBorder = borders[thisBorder];
            if(thisBorder !== "default") {
                borders[thisBorder]();
            }

        },false);

        // Set download link
        saveLink.addEventListener("click", function() {
            saveImg = canvas.toDataURL('image/jpeg',0.98);
            saveLink.href = dataURLToBlob(saveImg);
        }, false);
    };

    var resizeImg = function() {
        var newWidth = inputWidth.value,
            newHeight = newWidth / ratio,
            newCanvas = document.createElement("canvas"),
            newCtx = newCanvas.getContext("2d");

        // Clone current canvas image to new canvas canvas
        newCanvas.width = canvas.width;
        newCanvas.height = canvas.height;
        newCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height);

        // Resize current canvas (clears canvas)
       canvas.width = newWidth;
       canvas.height = newHeight;

        // Re-draw saved canvas image to current canvas
        ctx.drawImage(newCanvas, 0, 0, canvas.width + 0.5, canvas.height + 0.5);
    };

    // Creates a filled rectangle over the image, blending it with the chosen blend mode
    var applyColor = function(color, blend, strength) {
        ctx.save();

        ctx.fillStyle = color; // Color
        ctx.globalCompositeOperation = blend; // Blend mode
        ctx.globalAlpha = strength || 1; // Opacity, defaults to 1(00%)

        ctx.rect(0, 0, canvas.width, canvas.height); // Create layer
        ctx.fill(); // Draw layer

        ctx.restore();
    };

    // Creates a new image element over the image, with the same source, blending it with the chosen blend mode
    var applyImg = function(blend, strength, deSat) {
        ctx.save();

        ctx.globalCompositeOperation = blend; // Blend mode
        ctx.globalAlpha = strength || 1; // Opacity

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Draw image

        if (deSat) { // Desaturate
            applyColor("#ffffff","saturation",1);
        }

        ctx.restore();
    };

    var createVignette = function(hex) {
        // Hex to RGB
        var hex = hex.slice(1); // Remove leading #
            hex = hex.match(/.{2}/g); // Get groups of two
        var rgb = hex.map(function(i) {
                return parseInt(i,16); // Convert
            });
        rgb = rgb.join(","); // Rejoin

        // Create gradient
        var grd = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 1, canvas.width/2, canvas.height/2, Math.max(canvas.width, canvas.height));
        grd.addColorStop(0.4, "rgba(" + rgb + ",0)");
        grd.addColorStop(0.6, "rgba(" + rgb + ",1)");

        return grd; // Use value in applyColor();
    };

    // Create filters

    var filters = {

        filter1: function() {
            applyColor(createVignette("#000721"),"multiply",0.5)
            applyColor("#ff0000","saturation",0.1);
            applyImg("soft-light");
            applyImg("screen",0.3);
        },

        filter2: function() {
            applyImg("overlay");
            applyColor("#000000","saturation");
        },

        filter3: function() {
            applyImg("screen",0.5);
            applyColor("#000000","saturation",0.18);
            applyColor("#6d4206","difference",0.07);
            applyColor("#ecb5c4","soft-light",0.6);
            applyColor("#e48a49","soft-light",0.2);
            applyColor(createVignette("#000721"),"multiply",0.5);
            applyImg("soft-light");
        },

        filter4: function() {
            applyImg("screen",0.2);
            applyColor("#0c3df1","exclusion",.6);
            applyImg("overlay");
            applyColor(createVignette("#610000"),"lighten",0.5);
        },

        filter5: function() {
            applyImg("screen");
            applyColor("#020754","overlay");
            applyColor("#ea400c","lighten",0.3);
            applyImg("overlay",0.15);
        },

        filter6: function() {
            applyColor("#00c3d4","screen",0.62);
            applyColor("#005ad4","overlay",0.11);
            applyImg("overlay");
        },

        filter7: function() {
            applyColor("#ff0000","difference",0.2);
            applyColor("#ff0000","saturation",0.12);
            applyImg("overlay",0.64);
        },

        filter8: function() {
            applyColor("#5a422b","lighten");
            applyColor("#ea400c","saturation",0.09);
            applyColor("#2b2f5a","source-over",0.33);
            applyImg("soft-light",0.6);
        }

    };

    // Create borders
    var borders = {
        border1: function(){
            ctx.save();
            ctx.beginPath();
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = Math.round(canvas.width/50) || 1;
                ctx.rect(0, 0, canvas.width, canvas.height);
                ctx.stroke();
            ctx.restore();
        },

        border2: function() {
            ctx.save();
            ctx.beginPath();
                ctx.strokeStyle = "#ffffff"; // Color
                ctx.lineWidth = Math.round(canvas.width/80);
                ctx.rect(ctx.lineWidth * 2, ctx.lineWidth * 2, canvas.width - (ctx.lineWidth * 4), canvas.height - (ctx.lineWidth * 4)); // Create layer
                ctx.stroke(); // Draw layer
            ctx.restore();

        },

        border3: function() {
            applyColor(createVignette("#000721"),"multiply",0.5);
        },

        border4: function(){
            ctx.save();
            ctx.beginPath();
                ctx.fillStyle = "#000000";
                ctx.rect(0, 0, canvas.width, canvas.height/6);
                ctx.rect(0, (canvas.height-(canvas.height/6)), canvas.width, canvas.height);
                ctx.fill();
            ctx.restore();
        },

        border5: function() { // Urgent streamlining required
            ctx.save();
            ctx.strokeStyle = "#ffffff";
            var linePercent = Math.round(canvas.width / 50);
            ctx.lineWidth = linePercent;

            ctx.beginPath();
            ctx.moveTo(0,0);

            // Top
            var tx = 0;
            var ty = linePercent;
            for(var j = 0; j < canvas.width; j+=linePercent*5){
              tx +=linePercent*2.5;
              ctx.lineTo(tx,ty);
              tx +=linePercent*2.5;
              ctx.lineTo(tx,0);
            }

            // Right
            ctx.moveTo(canvas.width,0);
            var rx = canvas.width-linePercent;
            var ry = 0;
            for(var k = 0; k < canvas.height; k+=linePercent*5){
              ry +=linePercent*2.5;
              ctx.lineTo(rx,ry);
              ry +=linePercent*2.5;
              ctx.lineTo(rx+linePercent,ry);
            }

            // Left
            ctx.moveTo(0,0);
            var x = linePercent;
            var y = 0;
            for(var i = 0; i < canvas.height; i+=(linePercent*5)){
              y +=(linePercent*2.5);
              ctx.lineTo(x,y);
              y +=(linePercent*2.5);
              ctx.lineTo(0,y);
            }

            // Bottom
            ctx.moveTo(0,canvas.height);
            var bx = 0;
            var by = canvas.height-linePercent;
            for(var l = 0; l < canvas.width; l+=linePercent*5){
              bx +=linePercent*2.5;
              ctx.lineTo(bx,by);
              bx +=linePercent*2.5;
              ctx.lineTo(bx,by+linePercent);
            }

            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0,0);
            ctx.rect(0,0,canvas.width,canvas.height);
            ctx.stroke();
            ctx.restore();
        }
    };

// Upload buttons
btnUpload.addEventListener("change", getImage, false);
sidebarUpload.addEventListener("change", getImage, false);

}());
