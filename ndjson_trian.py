from ultralytics import YOLO

# Load a model
model = YOLO("yolo26n.pt")

# Train using NDJSON dataset
results = model.train(data="path/to/dataset.ndjson", epochs=100, imgsz=640)