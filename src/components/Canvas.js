import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Modal, Input } from 'antd';

const Canvas = ({
					image,
					onLabel,
					allDrawings,
					setAllDrawings,
					currentLabel,
					setCurrentLabel,
					isModalVisible,
					setIsModalVisible,
					isEraserActive,
					onDrawingErase
				}) => {
	const canvasRef = useRef(null);
	const [points, setPoints] = useState([]);
	const [tempDrawing, setTempDrawing] = useState(null);
	const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });

	const drawImage = useCallback((context, img, width, height) => {
		context.clearRect(0, 0, width, height);
		context.drawImage(img, 0, 0, width, height);
		allDrawings.forEach(drawing => {
			const scaledPoints = drawing.points.map(point => [
				(point[0] / imgDimensions.width) * width,
				(point[1] / imgDimensions.height) * height
			]);
			drawPath(context, scaledPoints);
		});
	}, [allDrawings, imgDimensions]);

	const resizeCanvas = useCallback(() => {
		const canvas = canvasRef.current;
		const context = canvas.getContext('2d');
		const img = new Image();
		img.src = image;
		img.onload = () => {
			const { width, height } = adjustDimensions(img.width, img.height);
			setCanvasSize(canvas, width, height);
			setImgDimensions({ width: img.width, height: img.height });
			drawImage(context, img, width, height);
		};
	}, [image, drawImage]);

	useEffect(() => {
		resizeCanvas();
		window.addEventListener('resize', resizeCanvas);
		return () => {
			window.removeEventListener('resize', resizeCanvas);
		};
	}, [resizeCanvas]);

	const adjustDimensions = (width, height) => {
		const maxWidth = Math.min(width, window.innerWidth - 100); // 100px padding
		const maxHeight = Math.min(height, window.innerHeight - 100); // 100px padding
		if (width > maxWidth || height > maxHeight) {
			const aspectRatio = width / height;
			if (width > maxWidth) {
				width = maxWidth;
				height = width / aspectRatio;
			}
			if (height > maxHeight) {
				height = maxHeight;
				width = height * aspectRatio;
			}
		}
		return { width, height };
	};

	const setCanvasSize = (canvas, width, height) => {
		canvas.width = width;
		canvas.height = height;
		canvas.style.width = `${width}px`;
		canvas.style.height = `${height}px`;
	};

	const drawPath = (context, points) => {
		context.beginPath();
		context.moveTo(points[0][0], points[0][1]);
		points.forEach(point => context.lineTo(point[0], point[1]));
		context.closePath();
		context.stroke();
		context.fillStyle = 'rgba(0, 0, 255, 0.3)';
		context.fill();
	};

	const handleMouseDown = (e) => {
		const { x, y } = getCanvasCoordinates(e);
		if (isEraserActive) {
			eraseDrawing(x, y);
		} else {
			setPoints([[x, y]]);
		}
	};

	const handleMouseMove = (e) => {
		if (points.length > 0) {
			const { x, y } = getCanvasCoordinates(e);
			setPoints(prevPoints => {
				const newPoints = [...prevPoints, [x, y]];
				drawLine(newPoints);
				return newPoints;
			});
		}
	};

	const handleMouseUp = () => {
		if (!isEraserActive && points.length > 0) {
			setTempDrawing(points);
			setIsModalVisible(true);
		}
	};

	const getCanvasCoordinates = (e) => {
		const rect = canvasRef.current.getBoundingClientRect();
		return {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top
		};
	};

	const drawLine = (newPoints) => {
		const canvas = canvasRef.current;
		const context = canvas.getContext('2d');
		context.beginPath();
		context.moveTo(newPoints[newPoints.length - 2][0], newPoints[newPoints.length - 2][1]);
		context.lineTo(newPoints[newPoints.length - 1][0], newPoints[newPoints.length - 1][1]);
		context.stroke();
	};

	const eraseDrawing = (x, y) => {
		const eraserRadius = 10; // Radius of the eraser tool
		const updatedDrawings = allDrawings.filter(drawing => {
			const points = drawing.points.map(point => [
				(point[0] / imgDimensions.width) * canvasRef.current.width,
				(point[1] / imgDimensions.height) * canvasRef.current.height
			]);
			const shouldErase = points.some(point => {
				const dx = point[0] - x;
				const dy = point[1] - y;
				return Math.sqrt(dx * dx + dy * dy) < eraserRadius;
			});
			if (shouldErase) {
				onDrawingErase(drawing);
			}
			return !shouldErase;
		});
		setAllDrawings(updatedDrawings);
		resizeCanvas();
	};

	const handleOk = () => {
		if (currentLabel && tempDrawing) {
			const scaledPoints = tempDrawing.map(point => [
				(point[0] / canvasRef.current.width) * imgDimensions.width,
				(point[1] / canvasRef.current.height) * imgDimensions.height
			]);
			const newDrawing = { points: scaledPoints, label: currentLabel };
			setAllDrawings(prevDrawings => [...prevDrawings, newDrawing]);
			onLabel(newDrawing);
			resetDrawingState();
		}
	};

	const handleCancel = () => {
		resetDrawingState();
	};

	const resetDrawingState = () => {
		resizeCanvas();
		setPoints([]);
		setTempDrawing(null);
		setCurrentLabel("");
		setIsModalVisible(false);
	};

	return (
		<>
			<canvas
				ref={canvasRef}
				style={{ border: '1px solid #000' }}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onContextMenu={(e) => e.preventDefault()}
			/>
			<Modal title="Enter Label" open={isModalVisible} onOk={handleOk} onCancel={handleCancel}>
				<Input
					type="text"
					value={currentLabel}
					onChange={(e) => setCurrentLabel(e.target.value)}
					placeholder="Enter label"
				/>
			</Modal>
		</>
	);
};

export default Canvas;
