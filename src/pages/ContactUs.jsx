import React from 'react';
import { Mail, ShieldAlert, MessageSquare } from 'lucide-react';

const ContactUs = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 animate-in fade-in duration-700">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-black text-white mb-4 uppercase italic tracking-tighter">
          Get in <span className="text-red-600">Touch</span>
        </h1>
        <p className="text-gray-500 max-w-lg mx-auto uppercase text-[10px] tracking-[0.3em] font-bold">
          Technical Support & Business Inquiries
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Email Card */}
        <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:border-red-600/50 transition-all group">
          <div className="w-12 h-12 bg-red-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-red-600 transition-colors">
            <Mail className="text-red-600 group-hover:text-white" />
          </div>
          <h3 className="text-white font-bold mb-2 uppercase text-sm tracking-widest">Email Us</h3>
          <p className="text-gray-500 text-xs mb-4">For general questions and advertising.</p>
          <a href="mailto:ugbedahamos@gmail.com" className="text-red-500 font-black hover:underline break-all">
            ugbedahamos@gmail.com
          </a>
        </div>

        {/* DMCA Card */}
        <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:border-yellow-600/50 transition-all group">
          <div className="w-12 h-12 bg-yellow-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-yellow-600 transition-colors">
            <ShieldAlert className="text-yellow-600 group-hover:text-white" />
          </div>
          <h3 className="text-white font-bold mb-2 uppercase text-sm tracking-widest">DMCA / Copyright</h3>
          <p className="text-gray-500 text-xs mb-4">Report content that violates your rights.</p>
          <span className="inline-block px-3 py-1 bg-yellow-600/20 text-yellow-600 text-[10px] font-bold rounded-full uppercase">
            Fast Response: 24h
          </span>
        </div>
      </div>

      {/* Notice Box */}
      <div className="mt-12 p-8 bg-red-600/5 border border-red-600/20 rounded-3xl">
        <div className="flex gap-4 items-start">
          <MessageSquare className="text-red-600 shrink-0" size={24} />
          <div>
            <h4 className="text-white font-bold text-sm uppercase mb-2">Notice to Broadcasters</h4>
            <p className="text-gray-500 text-xs leading-relaxed">
              VORTEXLIVE acts as a search engine for publicly available sports streams. We do not host any media files on our servers. 
              If you wish to request the removal of a link, please provide the specific URL in your email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;