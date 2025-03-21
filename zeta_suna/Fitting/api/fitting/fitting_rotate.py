import numpy as np

def matrix_multiply(A, B):
    # # 获取矩阵A和B的尺寸
    # rows_A = len(A)
    # cols_A = len(A[0])
    # rows_B = len(B)
    # cols_B = len(B[0])

    # # 检查矩阵A的列数是否等于矩阵B的行数
    # if cols_A != rows_B:
    #     raise ValueError("矩阵A的列数必须等于矩阵B的行数")

    #     # 创建一个结果矩阵，并用0填充
    # result = [[0 for _ in range(cols_B)] for _ in range(rows_A)]

    # # 执行矩阵乘法
    # for i in range(rows_A):
    #     for j in range(cols_B):
    #         for k in range(cols_A):
    #             result[i][j] += A[i][k] * B[k][j]
    # return result

    # 优化为NumPy内置运算
    return np.dot(A, B)
def rotate31(x, y, percent):
    # print(x.shape,y.shape,percent,'bbbbbb')
    n = len(x[0][0])
    n1 = int(np.floor(n * percent + 1))
    n2 = int(np.floor(n - n1 + 1))
    theta = np.arctan2((y[:,:,n2 - 1] - y[:,:,n1 - 1]), (x[:,:,n2 - 1] - x[:,:,n1 - 1]))
    M = np.array([[np.cos(theta), np.sin(theta)],
                    [-np.sin(theta), np.cos(theta)]])
    M=np.transpose(M,axes=(2,3,0,1))
    # print(M)
    # print(M.shape)
    R1 = np.concatenate([x[:,:,None,:],y[:,:,None,:]],axis=-2)
    # print(R1.shape)
    # R2 = np.dot(M, R1)  # 旋转后坐标
    R2=np.matmul(M,R1)
    # R2=self.matrix_multiply(M,R1)
    R2=np.asarray(R2)
    # print(R2.shape,'cccccc')
    # print(R1,R2,'rrrrrr')
    return R2[:,:, 0,:], R2[:,:,1, :]
def rotate3(x, y, percent):
    n = len(x)
    n1 = int(np.floor(n * percent + 1))
    n2 = int(np.floor(n - n1 + 1))
    theta = np.arctan2((y[n2 - 1] - y[n1 - 1]), (x[n2 - 1] - x[n1 - 1]))
    M = np.array([[np.cos(theta), np.sin(theta)],
                    [-np.sin(theta), np.cos(theta)]])
    # print(M)
    R1 = np.vstack((x, y))
    # R2 = np.dot(M, R1)  # 旋转后坐标
    # R2=np.matmul(M,R1)
    R2=matrix_multiply(M,R1)
    R2=np.asarray(R2)
    # print(R1,R2,'rrrrrr')
    return R2[0, :], R2[1, :]
