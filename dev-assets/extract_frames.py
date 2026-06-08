import cv2
import os

video_path = r'D:\Shared\Projects\小游戏\猫咪动画改造游戏\给我家猫咪看的动画 [BV1jFUkBPEZA].mp4'
cap = cv2.VideoCapture(video_path)

os.makedirs('assets/frames', exist_ok=True)
os.makedirs('assets/sprites', exist_ok=True)
os.makedirs('assets/backgrounds', exist_ok=True)
os.makedirs('assets/sounds', exist_ok=True)

fps = cap.get(cv2.CAP_PROP_FPS)
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

interval = int(fps * 30)
saved = 0

for frame_idx in range(0, total_frames, interval):
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
    ret, frame = cap.read()
    if ret:
        timestamp = frame_idx / fps
        filename = f'assets/frames/frame_{timestamp:06.1f}s.jpg'
        cv2.imwrite(filename, frame)
        saved += 1
        print(f'Saved: {filename} (at {timestamp:.1f}s)')

cap.release()
print(f'\nTotal frames extracted: {saved}')
