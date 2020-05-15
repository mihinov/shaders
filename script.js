function drawWebglCanvas(f, v, gl, image) {
	function resizeGlAndCanvas(gl) {
		resizeCanvas(gl);
		const resizeFunc = () => {
			resizeCanvas(gl);
			render();
		};
		const lazyFunc = debounce(resizeFunc, 100);
		window.addEventListener('resize', lazyFunc);
	}
	resizeGlAndCanvas(gl);

	const vertexShader = createShader(gl, gl.VERTEX_SHADER, v);
	const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, f);
	const program = createProgram(gl, vertexShader, fragmentShader);

	
	const positionLocation = gl.getAttribLocation(program, 'a_position');
	const texcoordLocation = gl.getAttribLocation(program, "a_texCoord");

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	setRectangle(gl, 0, 0, gl.canvas.width,  gl.canvas.height);

	const texCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
		0.0,  0.0,
		1.0,  0.0,
		0.0,  1.0,
		0.0,  1.0,
		1.0,  0.0,
		1.0,  1.0
	]), gl.STATIC_DRAW);

	// создаём текстуру
	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);

	// задаём параметры, чтобы можно было отрисовать изображение любого размера
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	
	// lookup uniforms
	const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
	const textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");
	const kernelLocation = gl.getUniformLocation(program, "u_kernel[0]");
	const kernelWeightLocation = gl.getUniformLocation(program, "u_kernelWeight");
  

	const kernels = {
		normal: [
		  0, 0, 0,
		  0, 1, 0,
		  0, 0, 0
		],
		gaussianBlur: [
		  0.045, 0.122, 0.045,
		  0.122, 0.332, 0.122,
		  0.045, 0.122, 0.045
		],
		gaussianBlur2: [
		  1, 2, 1,
		  2, 4, 2,
		  1, 2, 1
		],
		gaussianBlur3: [
		  0, 1, 0,
		  1, 1, 1,
		  0, 1, 0
		],
		unsharpen: [
		  -1, -1, -1,
		  -1,  9, -1,
		  -1, -1, -1
		],
		sharpness: [
		   0,-1, 0,
		  -1, 5,-1,
		   0,-1, 0
		],
		sharpen: [
		   -1, -1, -1,
		   -1, 16, -1,
		   -1, -1, -1
		],
		edgeDetect: [
		   -0.125, -0.125, -0.125,
		   -0.125,  1,     -0.125,
		   -0.125, -0.125, -0.125
		],
		edgeDetect2: [
		   -1, -1, -1,
		   -1,  8, -1,
		   -1, -1, -1
		],
		edgeDetect3: [
		   -5, 0, 0,
			0, 0, 0,
			0, 0, 5
		],
		edgeDetect4: [
		   -1, -1, -1,
			0,  0,  0,
			1,  1,  1
		],
		edgeDetect5: [
		   -1, -1, -1,
			2,  2,  2,
		   -1, -1, -1
		],
		edgeDetect6: [
		   -5, -5, -5,
		   -5, 39, -5,
		   -5, -5, -5
		],
		sobelHorizontal: [
			1,  2,  1,
			0,  0,  0,
		   -1, -2, -1
		],
		sobelVertical: [
			1,  0, -1,
			2,  0, -2,
			1,  0, -1
		],
		previtHorizontal: [
			1,  1,  1,
			0,  0,  0,
		   -1, -1, -1
		],
		previtVertical: [
			1,  0, -1,
			1,  0, -1,
			1,  0, -1
		],
		boxBlur: [
			0.111, 0.111, 0.111,
			0.111, 0.111, 0.111,
			0.111, 0.111, 0.111
		],
		triangleBlur: [
			0.0625, 0.125, 0.0625,
			0.125,  0.25,  0.125,
			0.0625, 0.125, 0.0625
		],
		emboss: [
		   -2, -1,  0,
		   -1,  1,  1,
			0,  1,  2
		]
	};

	const initialSelection = 'edgeDetect2';

	const ui = document.querySelector("#ui");
	const select = document.createElement("select");

	for (let name in kernels) {
		const option = document.createElement('option');
		option.value = name;
		if (name === initialSelection) {
			option.selected = true;
		}
		option.appendChild(document.createTextNode(name));
		select.appendChild(option);
	}

	select.addEventListener('change', function(e) {
		drawWithKernel(this.options[this.selectedIndex].value);
	});
	ui.appendChild(select);

	drawWithKernel(initialSelection);

	function computeKernelWeight(kernel) {
		const weight = kernel.reduce((prev, curr) => prev + curr);
		return weight <= 0 ? 1 : weight;
	}

	function drawWithKernel(name) {
    	gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.useProgram(program);
		gl.enableVertexAttribArray(positionLocation);
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(texcoordLocation);
		// gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
		gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);
		gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
		gl.uniform2f(textureSizeLocation, gl.canvas.width, gl.canvas.height);
		gl.uniform1fv(kernelLocation, kernels[name]);
		gl.uniform1f(kernelWeightLocation, computeKernelWeight(kernels[name]));
		render();
	}

	function render() {
		const primitiveType = gl.TRIANGLES;
		const offset = 0;
		const count = 6;
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(primitiveType, offset, count);
	}
}

function setRectangle(gl, x, y, width, height) {
	const x1 = x;
	const x2 = x + width;
	const y1 = y;
	const y2 = y + height;
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
	   x1, y1,
	   x2, y1,
	   x1, y2,
	   x1, y2,
	   x2, y1,
	   x2, y2,
	]), gl.STATIC_DRAW);
  }

void async function () {
	// const fragment = await sendGetRequest('fragment.glsl'); // получаю текст из файла
	// const vertex = await sendGetRequest('vertex.glsl'); // получаю текст из файла
	const fragment = document.querySelector('#fragment-shader-2d').innerText;
	const vertex = document.querySelector('#vertex-shader-2d').innerText;
	const canvas = document.querySelector('#glcanvas');
	const gl = initwebgl(canvas);
    if (!gl) {
		return;
	}
	const image = new Image();
	const url = "https://picsum.photos/1000/700";
	requestCORSIfNotSameOrigin(image, url);
	image.src = url;
	image.addEventListener('load', () => {
		drawWebglCanvas(fragment, vertex, gl, image);
	});
}();