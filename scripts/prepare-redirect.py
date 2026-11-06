#!/usr/bin/env python3
"""Preserve the old portfolio URL after the combined site is live."""
import argparse
from pathlib import Path
from urllib.request import urlopen

TARGET = 'https://tokyosol1992.github.io/portfolio/'


def build(output: Path, verify_target: bool = False) -> None:
    if verify_target:
        with urlopen(TARGET, timeout=30) as response:
            html = response.read().decode('utf-8')
            if response.status != 200 or '<title>Oh SolGil' not in html:
                raise RuntimeError('통합 포트폴리오의 배포 성공을 먼저 확인해 주세요.')
    output.mkdir(parents=True, exist_ok=True)
    (output / '.nojekyll').write_text('')
    (output / 'index.html').write_text('''<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Oh SolGil 포트폴리오</title>
  <link rel="canonical" href="https://tokyosol1992.github.io/portfolio/">
  <meta http-equiv="refresh" content="0;url=https://tokyosol1992.github.io/portfolio/">
  <script>
    location.replace('https://tokyosol1992.github.io/portfolio/' + location.search + location.hash);
  </script>
</head>
<body><p><a href="https://tokyosol1992.github.io/portfolio/">Oh SolGil 포트폴리오로 이동</a></p></body>
</html>
''', encoding='utf-8')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--verify-target', action='store_true')
    parser.add_argument('--output', type=Path, default=Path('dist-redirect'))
    args = parser.parse_args()
    build(args.output, args.verify_target)
