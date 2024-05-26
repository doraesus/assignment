import React, { useState } from 'react';
import { Layout, Button, Row, Col, Collapse } from 'antd';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import UploadForm from './components/UploadForm';
import Canvas from './components/Canvas';
import { ExportOutlined } from '@ant-design/icons';

const { Header, Content } = Layout;
const { Panel } = Collapse;

const App = () => {
	const [image, setImage] = useState(null);
	const [labels, setLabels] = useState([]);
	const [allDrawings, setAllDrawings] = useState([]);
	const [currentLabel, setCurrentLabel] = useState('');
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [isEraserActive, setIsEraserActive] = useState(false); // State to toggle eraser tool
	const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });

	const handleLabel = (newLabel) => {
		setLabels((prevLabels) => [...prevLabels, newLabel]);
	};

	const handleDrawingErase = (erasedDrawing) => {
		setLabels(prevLabels => prevLabels.filter(label => label !== erasedDrawing));
	};

	const handleImageUpload = (img) => {
		setImage(img);
		const imgElem = new Image();
		imgElem.src = img;
		imgElem.onload = () => {
			setImgDimensions({ width: imgElem.width, height: imgElem.height });
		};
	};

	const generateLabelFile = () => {
		const labelCanvas = document.createElement('canvas');
		labelCanvas.width = imgDimensions.width;
		labelCanvas.height = imgDimensions.height;
		const labelCtx = labelCanvas.getContext('2d');
		labelCtx.fillStyle = 'black';
		labelCtx.fillRect(0, 0, imgDimensions.width, imgDimensions.height);
		allDrawings.forEach((drawing) => {
			labelCtx.beginPath();
			labelCtx.moveTo(drawing.points[0][0], drawing.points[0][1]);
			drawing.points.forEach((point) => labelCtx.lineTo(point[0], point[1]));
			labelCtx.closePath();
			labelCtx.fillStyle = 'white';
			labelCtx.fill();
		});
		return labelCanvas.toDataURL('image/png');
	};

	const handleExport = () => {
		const labelDataUrl = generateLabelFile();
		const zip = new JSZip();
		const canvas = document.querySelector('canvas');
		zip.file('label.png', labelDataUrl.split(',')[1], { base64: true });
		zip.file('image.png', canvas.toDataURL('image/png').split(',')[1], { base64: true });
		zip.generateAsync({ type: 'blob' }).then((content) => {
			saveAs(content, 'drawings.zip');
		});
	};

	return (
		<Layout>
			<Header style={{ color: 'white' }}>Image Labeling App</Header>
			<Content style={{ padding: '50px', display: 'flex', flexDirection: 'column' }}>
				<Row style={{ marginBottom: '20px' }} align="top">
					<Col>
						<UploadForm setImage={handleImageUpload} />
					</Col>
					<Col>
						<Button onClick={handleExport} icon={<ExportOutlined />}>
							Export
						</Button>
					</Col>
					<Col>
						<Button onClick={() => setIsEraserActive(!isEraserActive)}>
							{isEraserActive ? 'Disable Eraser' : 'Enable Eraser'}
						</Button>
					</Col>
				</Row>
				<Row>
					{image && (
						<Col span={16}>
							<Canvas
								image={image}
								onLabel={handleLabel}
								allDrawings={allDrawings}
								setAllDrawings={setAllDrawings}
								currentLabel={currentLabel}
								setCurrentLabel={setCurrentLabel}
								isModalVisible={isModalVisible}
								setIsModalVisible={setIsModalVisible}
								isEraserActive={isEraserActive}
								onDrawingErase={handleDrawingErase}
							/>
						</Col>
					)}
					{labels.length > 0 && (
						<Col span={8}>
							<h3>Labels:</h3>
							<Collapse accordion>
								{labels.map((label, index) => (
									<Panel header={label.label} key={index}>
										<p>{JSON.stringify(label.points, null, 2)}</p>
									</Panel>
								))}
							</Collapse>
						</Col>
					)}
				</Row>
			</Content>
		</Layout>
	);
};

export default App;
