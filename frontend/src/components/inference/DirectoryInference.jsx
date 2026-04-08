import React from 'react';
import { Form, Upload, Button, Row, Col, Slider } from 'antd';
import { UploadOutlined, FolderOutlined } from '@ant-design/icons';

const DirectoryInference = ({ params, loadingPredict, updateParam, onPredict, form }) => {

  const [fileList, setFileList] = React.useState([]);



  const handleUploadChange = (info) => {



      setFileList(info.fileList);



      // 将文件信息保存到Form中，避免循环引用



      if (info.fileList.length > 0) {



        const file = info.fileList[0];



        form.setFieldValue('directory', {



          originFileObj: file.originFileObj,



          name: file.name,



          status: file.status



        });



      } else {



        form.setFieldValue('directory', undefined);



      }



    };



  const beforeUpload = (file) => {

    return false;

  };



  return (



      <>



        <Form.Item name="directory" label="上传图片目录压缩包"



                  rules={[{ required: true, message: '请上传压缩包' }]}



                  extra="支持 .zip, .tar.gz 格式">



                  <Upload



                    beforeUpload={beforeUpload}



                    onChange={handleUploadChange}



                    listType="text"



                    maxCount={1}



                    accept=".zip,.tar.gz,.tgz"



                    fileList={fileList}



                  >



                    <Button icon={<UploadOutlined />}>选择压缩包</Button>



                  </Upload>



                </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label={`置信度阈值`}>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={params.directory_conf}
              onChange={(value) => updateParam('directory_conf', value)}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label={`IoU 阈值`}>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={params.directory_iou}
              onChange={(value) => updateParam('directory_iou', value)}
            />
          </Form.Item>
        </Col>
      </Row>

      <Button type="primary" onClick={onPredict} loading={loadingPredict} block>
        开始批量推理
      </Button>
    </>
  );
};

export default DirectoryInference;