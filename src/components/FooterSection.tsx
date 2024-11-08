import React from "react";
import { FaInstagram, FaLinkedin, FaXTwitter } from "react-icons/fa6";

const FooterSection = () => {
  return (
    <footer>
      <div className="py-20 px-12 space-y-4 text-center lg:px-32 flex flex-col lg:flex-row justify-between ">
        <h1 className="font-bold text-3xl">
          Pre<span className="text-primary">777</span>
        </h1>{" "}
        <p className="text-white/70 text-sm">
          Copyright © 2024{" "}
          <span className="text-violet-500 font-semibold">Pre777</span>. All
          rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default FooterSection;
