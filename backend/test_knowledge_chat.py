"""
测试知识库对话功能
"""
import asyncio
import sys
sys.path.append('/home/star/qzp/llm_auto_train/backend')

from services.knowledge_service import KnowledgeService

async def test_knowledge():
    knowledge_service = KnowledgeService()
    
    # 测试搜索
    print("=== 测试知识库搜索 ===")
    test_keywords = ["难度", "FPGA", "成本"]
    
    for keyword in test_keywords:
        result = knowledge_service.search_documents(keyword, 3)
        print(f"\n搜索 '{keyword}':")
        print(f"  成功: {result.get('success')}")
        if result.get('success'):
            docs = result.get('data', [])
            print(f"  找到 {len(docs)} 个文档")
            for doc in docs:
                content_preview = doc.get('content', '')[:100]
                print(f"  - {doc.get('filename')}: {content_preview}...")

if __name__ == '__main__':
    asyncio.run(test_knowledge())
