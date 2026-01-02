import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-gray-400 leading-relaxed animate-in fade-in duration-700">
      <h1 className="text-4xl font-black text-white mb-8 uppercase italic tracking-tighter">
        Privacy <span className="text-red-600">Policy</span>
      </h1>
      
      <section className="mb-10">
        <p className="text-lg mb-4">
          At <span className="text-white font-bold">VORTEXLIVE</span>, accessible from our domain, one of our main priorities is the privacy of our visitors. 
          This Privacy Policy document contains types of information that is collected and recorded by VORTEXLIVE and how we use it.
        </p>
      </section>

      <div className="space-y-12">
        <section>
          <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-widest border-l-4 border-red-600 pl-4">
            1. Log Files
          </h2>
          <p className="text-sm">
            VORTEXLIVE follows a standard procedure of using log files. These files log visitors when they visit websites. 
            The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), 
            date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-widest border-l-4 border-red-600 pl-4">
            2. Cookies and Web Beacons
          </h2>
          <p className="text-sm">
            Like any other website, VORTEXLIVE uses 'cookies'. These cookies are used to store information including visitors' preferences, 
            and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by 
            customizing our web page content based on visitors' browser type and/or other information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-widest border-l-4 border-red-600 pl-4">
            3. Advertising Partners
          </h2>
          <p className="text-sm mb-4">
            Third-party ad servers or ad networks use technologies like cookies, JavaScript, or Web Beacons that are used in their 
            respective advertisements and links that appear on VORTEXLIVE. They automatically receive your IP address when this occurs.
          </p>
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <p className="text-xs italic text-red-500 font-bold">
              Note: VORTEXLIVE has no access to or control over these cookies that are used by third-party advertisers.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-widest border-l-4 border-red-600 pl-4">
            4. Consent
          </h2>
          <p className="text-sm">
            By using our website, you hereby consent to our Privacy Policy and agree to its Terms and Conditions.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;