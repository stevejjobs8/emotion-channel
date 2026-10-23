# 밤의 채널

켜 두기만 하면 4K 영상과 음악이 끝없이 흐르는 감성 채널. 화면엔 버튼도, 좋아요도, 선택지도 없다. 처음에 한 번 누르면 그다음부터는 알아서 흐른다.

## 어떻게 움직이나

- **영상**: `playlist.json`의 영상을 분위기(밤하늘, 바다, 비, 도시, 하늘, 숲, 눈, 따뜻한 불빛)별로 2~4개씩 묶어 22~40초마다 천천히 넘긴다. 화면 크기에 맞는 가장 선명한 파일(큰 화면이면 4K)을 고른다.
- **음악**: `music/` 폴더의 곡을 섞어 6초씩 겹치며 끊김 없이 이어 튼다.
- **매일 새 영상**: GitHub Actions가 매일 새벽 3시에 Pixabay(그리고 키가 있으면 Pexels)에서 새 영상을 찾아 재생 목록에 더한다(최대 600개).
- 영상이 아직 하나도 없으면 실시간으로 그리는 장면(`ambient.html`)이 대신 나온다.
- 더블클릭하면 전체 화면.

## 처음 한 번 설정

1. [pixabay.com/api/docs](https://pixabay.com/api/docs/)에서 로그인하면 보이는 무료 API 키를 저장소 **Settings → Secrets and variables → Actions**에 `PIXABAY_API_KEY`로 넣는다. Pexels 키 발급이 다시 열리면 `PEXELS_API_KEY`도 넣을 수 있다.
2. **Settings → Pages**에서 Source를 **GitHub Actions**로 바꾼다.
3. **Actions → 새 영상 모으기 → Run workflow**로 첫 수집을 돌린다. 끝나면 사이트가 자동으로 배포된다.

## 음악 넣기

라이선스가 확실한 곡(Epidemic Sound, Pixabay Music 등)의 mp3를 `music/`에 올리면 목록이 자동으로 갱신된다. 인스타·유튜브에서 추출한 음원은 저작권 침해라 쓰지 않는다.

## 출처 표기

영상이 바뀔 때 오른쪽 아래에 촬영자 이름과 출처(Pixabay·Pexels) 링크가 5초 동안 흐리게 비친다.
