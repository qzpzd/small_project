import os
import pandas as pd
from jinja2 import Environment, FileSystemLoader

excelfile = './excelfiles'
images = './images'
for i,excel in enumerate(sorted(os.listdir(excelfile))): # sort the file names, so the order is preserved in the html file.  (Python 3


    df = pd.read_excel(os.path.join(excelfile,excel),engine='openpyxl')
    df['年龄'] = df['年龄'].astype(str) + ' 岁'
    df['身高'] = df['身高'].astype(str) + 'cm'
    #df['总收益率'] = df['总收益率'].astype(str) + '%'
    data = df.to_dict('records')

    results = {}
    results.update({'strategy_name': f'第{i}个策略',
                    'start_time': '2020-01-01',
                    'end_time': '2021-06-01',
                    'money': 20000,
                    'items': data})

    env = Environment(loader=FileSystemLoader('./'))

    template = env.get_template('template.html')
    #indicator = 'https://img-blog.csdnimg.cn/ee0fe1e43804477fbf00a5200579f748.png'
    with open(f"out{i}.html", 'a+', encoding='utf-8') as f:
        out = template.render(strategy_name=results['strategy_name'],
                            start_time=results['start_time'],
                            end_time=results['end_time'],
                            money=results['money'],
                            items = results['items'],
                            indicator=os.path.join(images,os.listdir(images)[i]))
        f.write(out)
        f.close()