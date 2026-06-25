import type { CSSProperties, ReactNode } from "react";
import type { GenderColorPalette } from "@/lib/animation-colors";

/**
 * 입체(3D) 선물상자 지오메트리 — CSS `transform-style: preserve-3d` 기반.
 *
 * 윗면·앞면·오른쪽면 3면이 동시에 보이는 등각(아이소메트릭) 시점으로 상자를 그린다.
 * 몸통(어두운 보라)과 뚜껑(밝은 중립 보라 + 리본)은 음영·오버행(립)·리본으로 확실히 구분된다.
 * 호출부(lootbox)는 이 모듈의 `BOX`·`ISO_CAMERA` 상수로 시점/치수를 한 곳에서 조정하고,
 * 뚜껑은 `IsoBoxLid` 를 Framer motion 래퍼로 감싸 폭발 시 발사·텀블시킨다.
 *
 * 주의: preserve-3d 체인 안에서는 opacity/filter/overflow/mask 를 쓰면 면이 평면으로
 * 붕괴된다(컴포지팅 그룹화). 따라서 면에는 배경색만 쓰고, 뚜껑 발사도 opacity 없이
 * transform(이동·회전)으로만 화면 밖으로 내보낸다.
 */

/** 상자 치수(px). 한 곳에서 시점/비율을 조정한다. */
export const BOX = {
  bodyW: 132,
  bodyD: 132,
  bodyH: 92,
  lidW: 150,
  lidD: 150,
  lidH: 40,
} as const;

/** 등각 카메라(장면 회전) — 윗면·앞면·오른쪽면 3면 동시 노출. */
export const ISO_CAMERA = "rotateX(-22deg) rotateY(-34deg)";

/** 원근 거리(px) — 클수록 평행투영(등각)에 가깝고, 작을수록 원근 왜곡이 강해진다. */
export const ISO_PERSPECTIVE = 900;

// 몸통/내부 음영 — 면 방향별 명도차로 입체감(animation-colors 주석 허용: 개별 애니메이션 자체 음영색).
const BODY_FRONT = "#6B43A0";
const BODY_SIDE = "#56327F";
const BOX_INSIDE = "#3C2459";
/** 금색 리본(amber-400). 뚜껑에만 둘러 몸통과 구분을 강화한다. */
const RIBBON = "#FBBF24";

interface FaceProps {
  w: number;
  h: number;
  transform: string;
  background: string;
  children?: ReactNode;
  style?: CSSProperties;
}

/** 큐보이드 한 면 — 부모(그룹) 원점에 중심을 맞춘 뒤 cube transform 으로 3D 배치한다. */
function Face({ w, h, transform, background, children, style }: FaceProps) {
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: w,
        height: h,
        marginLeft: -w / 2,
        marginTop: -h / 2,
        transformStyle: "preserve-3d",
        transform,
        background,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** 리본 띠(가로/세로) — 면 위에 덧대는 금색 스트랩. */
function RibbonStrap({ vertical }: { vertical?: boolean }) {
  return (
    <div
      style={
        vertical
          ? {
              position: "absolute",
              left: "50%",
              top: 0,
              width: 14,
              height: "100%",
              marginLeft: -7,
              background: RIBBON,
            }
          : {
              position: "absolute",
              top: "50%",
              left: 0,
              height: 14,
              width: "100%",
              marginTop: -7,
              background: RIBBON,
            }
      }
    />
  );
}

/**
 * 상자 몸통 — 앞면·오른쪽면(어두운 보라) + 윗면(열린 내부, 가장 어두움). 장면 원점에 배치한다.
 * 윗면은 뚜껑이 덮고 있다가, 뚜껑 발사 후 드러나 "열린 상자"로 읽힌다.
 */
export function IsoBoxBody() {
  const { bodyW, bodyD, bodyH } = BOX;
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: 0,
        height: 0,
        transformStyle: "preserve-3d",
      }}
    >
      {/* 앞면(+ 세로 리본 — 뚜껑 앞면 띠가 몸통까지 이어진다) */}
      <Face
        w={bodyW}
        h={bodyH}
        background={BODY_FRONT}
        transform={`translateZ(${bodyD / 2}px)`}
      >
        <RibbonStrap vertical />
      </Face>
      {/* 오른쪽면(+ 세로 리본 — 윗면 가로 띠가 옆면을 타고 몸통까지 이어진다) */}
      <Face
        w={bodyD}
        h={bodyH}
        background={BODY_SIDE}
        transform={`rotateY(90deg) translateZ(${bodyW / 2}px)`}
      >
        <RibbonStrap vertical />
      </Face>
      {/* 윗면(열린 내부) */}
      <Face
        w={bodyW}
        h={bodyD}
        background={BOX_INSIDE}
        transform={`rotateX(90deg) translateZ(${bodyH / 2}px)`}
      />
    </div>
  );
}

/**
 * 상자 뚜껑 — 몸통보다 밝은 중립색 + 금색 리본 + 매듭. 몸통보다 넓어(오버행) 립을 만든다.
 * 몸통 윗면 위(restY)에 얹힌 채 렌더되며, 발사 모션은 호출부의 motion 래퍼가 담당한다.
 * 밑면(어두운 내부색)을 둬 텀블 시 "뚜껑 안쪽"으로 읽히게 한다(빈 평면 노출 방지).
 */
export function IsoBoxLid({ neutral }: { neutral: GenderColorPalette }) {
  const { lidW, lidD, lidH, bodyH } = BOX;
  // 뚜껑이 몸통 윗면 위에 얹히는 기준 높이(장면 원점 기준).
  const restY = -(bodyH / 2 + lidH / 2);
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: 0,
        height: 0,
        transform: `translateY(${restY}px)`,
        transformStyle: "preserve-3d",
      }}
    >
      {/* 앞면(+ 세로 리본) */}
      <Face
        w={lidW}
        h={lidH}
        background={neutral.DEFAULT}
        transform={`translateZ(${lidD / 2}px)`}
      >
        <RibbonStrap vertical />
      </Face>
      {/* 오른쪽면(+ 세로 리본 — 윗면 가로 띠가 옆면을 타고 내려간다) */}
      <Face
        w={lidD}
        h={lidH}
        background={neutral.dark}
        transform={`rotateY(90deg) translateZ(${lidW / 2}px)`}
      >
        <RibbonStrap vertical />
      </Face>
      {/* 밑면(뚜껑 안쪽) — 텀블 시 노출. */}
      <Face
        w={lidW}
        h={lidD}
        background={BOX_INSIDE}
        transform={`rotateX(-90deg) translateZ(${lidH / 2}px)`}
      />
      {/* 윗면(+ 리본 십자 + 매듭) */}
      <Face
        w={lidW}
        h={lidD}
        background={neutral.light}
        transform={`rotateX(90deg) translateZ(${lidH / 2}px)`}
      >
        <RibbonStrap vertical />
        <RibbonStrap />
        {/* 매듭 — 윗면에서 살짝 솟은 금색 원. */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 26,
            height: 26,
            marginLeft: -13,
            marginTop: -13,
            borderRadius: "50%",
            background: RIBBON,
            transform: "translateZ(10px)",
          }}
        />
      </Face>
    </div>
  );
}
