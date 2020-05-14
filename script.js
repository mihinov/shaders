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
	gl.clearColor(0, 0, 0, 0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	const vertexShader = createShader(gl, gl.VERTEX_SHADER, v);
	const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, f);
	const program = createProgram(gl, vertexShader, fragmentShader);

	
	const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
	const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
	gl.useProgram(program);
	gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

	const positionBuffer = gl.createBuffer();
	gl.enableVertexAttribArray(positionAttributeLocation);
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	setRectangle(gl, 0, 0, gl.canvas.width, gl.canvas.height);
	gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

	// указываем координаты текстуры для прямоугольника
	const texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
	const texCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
		0.0,  0.0,
		1.0,  0.0,
		0.0,  1.0,
		0.0,  1.0,
		1.0,  0.0,
		1.0,  1.0]), gl.STATIC_DRAW);
	gl.enableVertexAttribArray(texCoordLocation);
	gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

	// создаём текстуру
	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);

	// задаём параметры, чтобы можно было отрисовать изображение любого размера
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	const textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");
	gl.uniform2f(textureSizeLocation, gl.canvas.width, gl.canvas.height);

	function computeKernelWeight(kernel) {
		const weight = kernel.reduce((prev, curr) => prev + curr);
		return weight <= 0 ? 1 : weight;
	}

	const kernelLocation = gl.getUniformLocation(program, "u_kernel[0]");
	const kernelWeightLocation = gl.getUniformLocation(program, "u_kernelWeight");
	const edgeDetectKernel = [
		-1, -1, -1,
      -1,  9, -1,
      -1, -1, -1
	];
	gl.uniform1fv(kernelLocation, edgeDetectKernel);
	gl.uniform1f(kernelWeightLocation, computeKernelWeight(edgeDetectKernel));

	function render() {
		const primitiveType = gl.TRIANGLES;
		const offset = 0;
		const count = 6;
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(primitiveType, offset, count);
	}
	render();
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
	const fragment = await sendGetRequest('fragment.glsl'); // получаю текст из файла
	const vertex = await sendGetRequest('vertex.glsl'); // получаю текст из файла
	// const fragment = document.querySelector('#fragment-shader-2d').innerText;
	// const vertex = document.querySelector('#vertex-shader-2d').innerText;
	const canvas = document.querySelector('#glcanvas');
	const gl = initwebgl(canvas);
    if (!gl) {
		return;
	}
	const image = new Image();
	const url = "https://picsum.photos/1000/700";
	requestCORSIfNotSameOrigin(image, url);
	image.src = url;
	image.crossOrigin = "";
	image.addEventListener('load', () => {
		drawWebglCanvas(fragment, vertex, gl, image);
	});
}();