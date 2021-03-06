import React from 'react';
import { Form, Input, Modal, Row, Col, message, Upload, Icon } from 'antd';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import config from '../../../../config/config';
import request from '../../../request/AxiosRequest';

const FormItem = Form.Item;
// const { Option } = Select;
let id = 2;

class AddDialog extends React.Component {
	constructor(props) {
		super(props);
	}

	state = {
		previewVisible: false,
		previewImage: '',
		fileList: [],
	};

	// 文件改变
	fileChange() {
		let self = this;
		let file = document.getElementById('goods_main_img').files[0];
		var reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onprogress = function (e) {
			if (e.lengthComputable) {
				// 简单把进度信息打印到控制台吧
				console.log(e.loaded / e.total + '%');
			}
		};
		reader.onload = function (e) {
			var image = new Image();
			image.src = e.target.result;
			let dom = document.querySelector('.goods_main_preview');
			dom.innerHTML = '';
			dom.appendChild(image);
			self.cropper = new Cropper(image, {
				aspectRatio: 4 / 4,
				zoomable: false,
			});
		};
		reader.onerror = function () {
			message.warning('服务端错误, 请稍后重试');
		};
	}

	// 描述信息改变
	descChange() {
		let files = document.getElementById('goods_desc_img').files;
		let dom = document.querySelector('.goods_desc_preview');
		for (let i = 0; i < files.length; i++) {
			var reader = new FileReader();
			reader.readAsDataURL(files[i]);
			reader.onload = function (e) {
				var image = new Image();
				image.src = e.target.result;
				dom.appendChild(image);
			};
			reader.onerror = function () {
				message.warning('服务端错误, 请稍后重试');
			};
		}
	}

	// 弹框确定
	async handleOk() {
		this.props.form.validateFields(async (err, values) => {
			try {
				if (err) return;
				let { keys, names, prices } = values;
				let specification = [];
				keys.map((key) => {
					specification.push({
						name: names[key],
						price: prices[key],
					});
				});
				if (!this.cropper) return message.warning('请上传主图');
				let campus = localStorage.getItem('campus') || '';
				this.cropper.getCroppedCanvas().toBlob(async (blob) => {
					let { fileList } = this.state;
					let desc = [];
					fileList.map((item) => {
						desc.push(item.response.data);
					});
					desc = JSON.stringify(desc);
					const formData = new FormData();
					formData.append('name', values.name);
					values.title ? formData.append('title', values.title) : null;
					formData.append('desc', desc);
					formData.append('price', values.price);
					formData.append('package_cost', values.package_cost);
					formData.append('file', blob);
					formData.append('position', campus);
					formData.append('shopid', this.props.shopid);
					formData.append('specification', JSON.stringify(specification));
					let res = await request.post('/goods/add', formData);
					if (res.data == 'success') {
						message.success('新增成功');
						this.props.onSearch();
						this.props.controllerAddDialog();
					}
				});
			} catch (error) {
				console.log(error);
			}
		});
	}

	handleDialogCancel() {
		this.props.controllerAddDialog();
	}

	// 弹框取消
	handleCancel() {
		this.setState({ previewVisible: false });
	}

	// 文件编码
	getBase64(file) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => resolve(reader.result);
			reader.onerror = (error) => reject(error);
		});
	}

	// 文件预览
	async handlePreview(file) {
		if (!file.url && !file.preview) {
			file.preview = await this.getBase64(file.originFileObj);
		}
		this.setState({
			previewImage: file.url || file.preview,
			previewVisible: true,
		});
	}

	// 文件上传改变
	handleChange({ fileList }) {
		this.setState({ fileList });
	}

	addType() {
		const { form } = this.props;
		// can use data-binding to get
		const keys = form.getFieldValue('keys');
		const nextKeys = keys.concat(id++);
		// can use data-binding to set
		// important! notify form to detect changes
		form.setFieldsValue({
			keys: nextKeys,
		});
	}

	removeType(k) {
		const { form } = this.props;
		// can use data-binding to get
		const keys = form.getFieldValue('keys');
		// can use data-binding to set
		form.setFieldsValue({
			keys: keys.filter((key) => key !== k),
		});
	}

	render() {
		const { getFieldDecorator, getFieldValue } = this.props.form;
		const formItemLayout = {
			labelCol: { span: 4 },
			wrapperCol: { span: 20 },
		};
		const { previewVisible, previewImage, fileList } = this.state;
		const uploadButton = (
			<div>
				<Icon type="plus" />
				<div className="ant-upload-text">Upload</div>
			</div>
		);
		getFieldDecorator('keys', { initialValue: [] });
		const keys = getFieldValue('keys');
		const formItems = keys.map((k, index) => {
			return (
				<Row key={index} className="goods_dialog_type_formitem">
					<Col span={10}>
						<Form.Item className="goods_dialog_type_formitem_input" label="" required={true}>
							{getFieldDecorator(`names[${k}]`, {
								validateTrigger: ['onChange', 'onBlur'],
								rules: [
									{
										required: true,
										whitespace: true,
										message: '请输入',
									},
								],
							})(<Input placeholder="请输入" />)}
						</Form.Item>
					</Col>
					<Col span={10}>
						<Form.Item label="" className="goods_dialog_type_formitem_input" required={true}>
							{getFieldDecorator(`prices[${k}]`, {
								validateTrigger: ['onChange', 'onBlur'],
								rules: [
									{
										required: true,
										whitespace: true,
										message: '请输入',
									},
								],
							})(<Input type="number" placeholder="请输入" />)}
						</Form.Item>
					</Col>
					<Col span={4} className="goods_dialog_type_title goods_dialog_type_plus">
						<Icon
							className="dynamic-delete-button"
							type="minus-circle-o"
							onClick={this.removeType.bind(this, k)}
						/>
					</Col>
				</Row>
			);
		});
		return (
			<div>
				<Modal
					className="common_dialog common_max_dialog"
					title="新增商品"
					visible={true}
					onOk={this.handleOk.bind(this)}
					onCancel={this.handleDialogCancel.bind(this)}
				>
					<Form {...formItemLayout} onSubmit={this.handleSubmit}>
						<FormItem label="商品名称">
							{getFieldDecorator('name', {
								rules: [
									{
										required: true,
										message: '请输入',
									},
								],
							})(<Input placeholder="请输入" />)}
						</FormItem>
						<FormItem label="价格">
							{getFieldDecorator('price', {
								rules: [
									{
										required: true,
										message: '请输入',
									},
								],
							})(<Input type="number" placeholder="请输入" />)}
						</FormItem>
						<FormItem label="餐盒费">
							{getFieldDecorator('package_cost', {
								rules: [
									{
										required: true,
										message: '请输入',
									},
								],
							})(<Input type="number" placeholder="请输入" />)}
						</FormItem>
						<FormItem label="描述">
							{getFieldDecorator('title')(<Input placeholder="请输入(8个字以内)" />)}
						</FormItem>
						<Row className="campus_container">
							<Col span={4} className="campus_container_label campus_container_label_require">
								主图录入：
							</Col>
							<Col span={20}>
								<input
									type="file"
									id="goods_main_img"
									accept="image/gif,image/jpeg,image/jpg,image/png,image/svg"
									onChange={this.fileChange.bind(this)}
								/>
							</Col>
						</Row>
						<Row className="campus_container goods_img_container">
							<Col span={4} className="campus_container_label"></Col>
							<Col span={20} className="goods_main_preview"></Col>
						</Row>
						<FormItem label="描述图片">
							{getFieldDecorator('descFile')(
								<Upload
									action={`${config.baseUrl}/goods/uploadDescImg`}
									listType="picture-card"
									withCredentials
									fileList={fileList}
									onPreview={this.handlePreview.bind(this)}
									onChange={this.handleChange.bind(this)}
								>
									{fileList.length >= 10 ? null : uploadButton}
								</Upload>,
							)}
						</FormItem>
						<FormItem className="goods_dialog_type_name" label="规格录入">
							<Row>
								<Col span={10} className="goods_dialog_type_title">
									规格
								</Col>
								<Col span={10} className="goods_dialog_type_title">
									价格
								</Col>
								<Col span={4} className="goods_dialog_type_title goods_dialog_type_plus">
									<Icon type="plus-circle" onClick={this.addType.bind(this)} />
								</Col>
							</Row>
						</FormItem>
						{formItems}
						<Modal visible={previewVisible} footer={null} onCancel={this.handleCancel.bind(this)}>
							<img alt="example" style={{ width: '100%' }} src={previewImage} />
						</Modal>
					</Form>
				</Modal>
			</div>
		);
	}
}

const AddDialogForm = Form.create()(AddDialog);
export default AddDialogForm;
