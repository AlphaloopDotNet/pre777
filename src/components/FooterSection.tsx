import React from "react";
import Image from "next/image";

const FooterSection = () => {
  return (
    <footer>
      <div className="py-8 px-12 space-y-4 text-center lg:px-32 flex flex-col lg:flex-row justify-between items-center">
        <Image src={"/logo7.png"} width={100} height={200} alt="pre777"></Image>
        <p className="text-white/70 text-sm ">
          Copyright © 2024{" "}
          <span className="text-violet-500 font-semibold">Pre777</span>. All
          rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default FooterSection;
