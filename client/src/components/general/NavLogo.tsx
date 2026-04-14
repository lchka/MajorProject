import React from "react";
import { Image } from "@gluestack-ui/themed";

type NavLogoProps = {
  width?: number;
  height?: number;
  marginBottom?: number;
  marginLeft?: number;
};

export default function NavLogo({
  width = 200,
  height = 100,
  marginBottom = 10,
  marginLeft = -20,
}: NavLogoProps) {
  return (
    <Image
      source={require("../../../assets/logo/8.png")}
      style={{ width, height, marginBottom, marginLeft }}
      resizeMode="contain"
      alt="Lumiere logo"
    />
  );
}