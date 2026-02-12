import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Ellipse, G, Path } from "react-native-svg";

// Strawberry decoration
export const Strawberry = ({
  size = 60,
  style,
}: {
  size?: number;
  style?: any;
}) => (
  <View style={style}>
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <G>
        {/* Strawberry body - richer red */}
        <Path
          d="M50 20 Q30 30 25 50 Q25 75 35 85 Q45 95 50 95 Q55 95 65 85 Q75 75 75 50 Q70 30 50 20 Z"
          fill="#E63946"
        />
        {/* Highlight for depth */}
        <Path
          d="M35 40 Q40 35 45 38 Q42 45 38 48 Z"
          fill="#FF6B6B"
          opacity="0.6"
        />
        {/* Seeds - more visible */}
        <Circle cx="38" cy="42" r="2.5" fill="#FFF3B0" />
        <Circle cx="50" cy="45" r="2.5" fill="#FFF3B0" />
        <Circle cx="62" cy="42" r="2.5" fill="#FFF3B0" />
        <Circle cx="42" cy="55" r="2.5" fill="#FFF3B0" />
        <Circle cx="58" cy="55" r="2.5" fill="#FFF3B0" />
        <Circle cx="50" cy="65" r="2.5" fill="#FFF3B0" />
        <Circle cx="45" cy="75" r="2.5" fill="#FFF3B0" />
        <Circle cx="55" cy="75" r="2.5" fill="#FFF3B0" />
        {/* Leaves - more detailed */}
        <Path d="M42 18 Q45 12 48 15 Q46 20 45 22 Z" fill="#2D6A4F" />
        <Path d="M48 15 Q50 10 52 15 Q51 20 50 22 Z" fill="#40916C" />
        <Path d="M52 15 Q55 12 58 18 Q56 20 55 22 Z" fill="#2D6A4F" />
      </G>
    </Svg>
  </View>
);

// Pineapple decoration
export const Pineapple = ({
  size = 80,
  style,
}: {
  size?: number;
  style?: any;
}) => (
  <View style={style}>
    <Svg width={size} height={size} viewBox="0 0 100 120">
      <G>
        {/* Pineapple body - warmer golden tone */}
        <Path
          d="M50 30 Q35 35 30 50 Q28 70 35 85 Q45 95 50 95 Q55 95 65 85 Q72 70 70 50 Q65 35 50 30 Z"
          fill="#FFB703"
        />
        {/* Darker base for depth */}
        <Path
          d="M35 80 Q45 90 50 93 Q55 90 65 80 Q70 70 68 60 L32 60 Q30 70 35 80 Z"
          fill="#FB8500"
          opacity="0.4"
        />
        {/* Diamond pattern - more detailed */}
        <Path d="M38 42 L43 37 L48 42 L43 47 Z" fill="#FB8500" opacity="0.6" />
        <Path d="M52 42 L57 37 L62 42 L57 47 Z" fill="#FB8500" opacity="0.6" />
        <Path d="M45 52 L50 47 L55 52 L50 57 Z" fill="#FB8500" opacity="0.6" />
        <Path d="M38 62 L43 57 L48 62 L43 67 Z" fill="#FB8500" opacity="0.6" />
        <Path d="M52 62 L57 57 L62 62 L57 67 Z" fill="#FB8500" opacity="0.6" />
        <Path d="M45 72 L50 67 L55 72 L50 77 Z" fill="#FB8500" opacity="0.6" />
        {/* Leaves - vibrant green */}
        <Path d="M42 26 Q48 14 46 8 Q44 14 48 20 L46 28 Z" fill="#2D6A4F" />
        <Path d="M48 22 Q52 10 56 6 Q54 12 50 18 L50 26 Z" fill="#40916C" />
        <Path d="M50 24 Q56 12 60 8 Q58 14 54 20 L52 28 Z" fill="#2D6A4F" />
        <Path d="M38 28 Q36 16 34 12 Q36 18 42 24 L44 30 Z" fill="#52B788" />
        <Path d="M56 26 Q60 14 62 10 Q60 16 56 22 L54 28 Z" fill="#52B788" />
      </G>
    </Svg>
  </View>
);

// Banana decoration
export const Banana = ({
  size = 60,
  style,
}: {
  size?: number;
  style?: any;
}) => (
  <View style={style}>
    <Svg width={size} height={size * 0.6} viewBox="0 0 120 70">
      <G>
        <Path
          d="M10 35 Q20 25 40 30 Q60 35 80 32 Q100 30 110 35 Q105 45 85 42 Q65 45 45 40 Q25 38 10 45 Z"
          fill="#FCD34D"
          stroke="#F59E0B"
          strokeWidth="2"
        />
        <Path
          d="M15 35 Q25 28 40 32 Q60 37 80 34"
          stroke="#F59E0B"
          strokeWidth="1"
          fill="none"
          opacity="0.3"
        />
      </G>
    </Svg>
  </View>
);

// Apple decoration
export const Apple = ({ size = 55, style }: { size?: number; style?: any }) => (
  <View style={style}>
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <G>
        {/* Apple body */}
        <Circle cx="50" cy="55" r="28" fill="#EF4444" />
        <Circle cx="45" cy="50" r="28" fill="#DC2626" />
        {/* Highlight */}
        <Circle cx="42" cy="45" r="8" fill="#FCA5A5" opacity="0.6" />
        {/* Stem */}
        <Path
          d="M50 25 Q48 30 50 35"
          stroke="#78350F"
          strokeWidth="3"
          fill="none"
        />
        {/* Leaf */}
        <Path d="M52 28 Q60 26 62 32 Q60 35 54 33 Z" fill="#22C55E" />
      </G>
    </Svg>
  </View>
);

// Pear decoration
export const Pear = ({ size = 60, style }: { size?: number; style?: any }) => (
  <View style={style}>
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <G>
        {/* Pear body - warmer golden tone */}
        <Path
          d="M50 35 Q40 35 35 45 Q30 60 35 75 Q40 90 50 95 Q60 90 65 75 Q70 60 65 45 Q60 35 50 35 Z"
          fill="#FFD60A"
        />
        {/* Shadow for depth */}
        <Path
          d="M50 35 Q60 35 65 45 Q70 60 65 75 Q62 85 55 90"
          fill="#FFC300"
          opacity="0.4"
        />
        {/* Stem and leaf */}
        <Path d="M48 30 Q45 25 50 18 Q48 25 50 30 Z" fill="#2D6A4F" />
        <Path d="M52 26 Q58 24 60 28 Q58 32 54 30 Z" fill="#52B788" />
        {/* Highlight */}
        <Ellipse cx="42" cy="48" rx="10" ry="15" fill="#FFF8DC" opacity="0.6" />
        <Circle cx="40" cy="45" r="4" fill="#FFFACD" opacity="0.8" />
      </G>
    </Svg>
  </View>
);

// Decorative dots pattern
export const DotsPattern = ({ style }: { style?: any }) => (
  <View style={[styles.dotsContainer, style]}>
    <Svg width="100%" height="100%" viewBox="0 0 400 800">
      <G opacity="0.4">
        {/* Top section dots */}
        <Circle cx="30" cy="40" r="3" fill="#FFB703" />
        <Circle cx="60" cy="25" r="2" fill="#FB8500" />
        <Circle cx="45" cy="70" r="2.5" fill="#FFD60A" />
        <Circle cx="80" cy="55" r="2" fill="#FFB703" />
        <Circle cx="20" cy="100" r="2" fill="#FB8500" />

        {/* Right side dots */}
        <Circle cx="360" cy="50" r="3" fill="#FB8500" />
        <Circle cx="340" cy="80" r="2" fill="#FFB703" />
        <Circle cx="370" cy="110" r="2.5" fill="#FFD60A" />
        <Circle cx="350" cy="140" r="2" fill="#FB8500" />

        {/* Middle scattered dots */}
        <Circle cx="100" cy="200" r="2" fill="#FFB703" />
        <Circle cx="300" cy="220" r="2.5" fill="#FB8500" />
        <Circle cx="50" cy="250" r="2" fill="#FFD60A" />
        <Circle cx="350" cy="280" r="2" fill="#FFB703" />
        <Circle cx="120" cy="320" r="2.5" fill="#FB8500" />

        {/* Lower section dots */}
        <Circle cx="30" cy="700" r="3" fill="#FFB703" />
        <Circle cx="60" cy="680" r="2" fill="#FB8500" />
        <Circle cx="45" cy="730" r="2.5" fill="#FFD60A" />
        <Circle cx="20" cy="760" r="2" fill="#FFB703" />

        <Circle cx="360" cy="720" r="3" fill="#FB8500" />
        <Circle cx="340" cy="690" r="2" fill="#FFB703" />
        <Circle cx="370" cy="750" r="2.5" fill="#FFD60A" />
      </G>
    </Svg>
  </View>
);

const styles = StyleSheet.create({
  dotsContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
});

export default {
  Strawberry,
  Pineapple,
  Banana,
  Apple,
  Pear,
  DotsPattern,
};
