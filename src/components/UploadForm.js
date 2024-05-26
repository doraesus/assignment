import React from 'react';
import { Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import JSZip from 'jszip';

const UploadForm = ({ setImage }) => {
	const uploadProps = {
		accept: ".zip",
		multiple: false,
		showUploadList: false,
		beforeUpload: (file) => {
			const isZip = file.type === 'application/zip';
			if (!isZip) {
				message.error('Please upload a ZIP file.');
			}
			return isZip || Upload.LIST_IGNORE;
		},
		customRequest: ({ file, onSuccess, onError }) => {
			const reader = new FileReader();
			reader.onload = async (e) => {
				try {
					const zip = await JSZip.loadAsync(e.target.result);
					const pngFile = Object.keys(zip.files).find(name => name.endsWith('.png'));
					if (pngFile) {
						const imgData = await zip.file(pngFile).async('base64');
						setImage(`data:image/png;base64,${imgData}`);
						onSuccess("ok");
					} else {
						message.error('No PNG file found in the ZIP.');
						onError(new Error('No PNG file found in the ZIP.'));
					}
				} catch (err) {
					message.error('Error reading ZIP file.');
					onError(err);
				}
			};
			reader.readAsArrayBuffer(file);
		}
	};

	return (
		<Upload {...uploadProps}>
			<Button icon={<UploadOutlined />}>Upload file</Button>
		</Upload>
	);
};

export default UploadForm;
