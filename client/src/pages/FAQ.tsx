import React from 'react';
import { BottomNav } from '../components/BottomNav';
import { MetaTags } from '../components/MetaTags';
import { restaurantInfo } from '../data/mockData';

export function FAQ() {
  const faqs = [
    {
      question: "What cuisines do you serve?",
      answer: "We specialize in authentic Middle Eastern and Indian cuisine, including Arabian Mandi, Chicken Biryani, grilled Kebabs, and traditional Shawarma."
    },
    {
      question: "Do you offer delivery service?",
      answer: "Yes! We offer free delivery within Hyderabad. Call us at +91 98765 43210 to place your order."
    },
    {
      question: "What are your operating hours?",
      answer: "We're open daily from 10:00 AM to 11:00 PM, serving fresh and delicious meals all day."
    },
    {
      question: "What is your signature dish?",
      answer: "Our signature Arabian Mandi is a must-try! It's a traditional Middle Eastern rice dish with tender meat, aromatic spices, and authentic flavors."
    },
    {
      question: "Do you have vegetarian options?",
      answer: "Yes, we offer several vegetarian dishes including vegetable biryani, paneer dishes, and various appetizers."
    },
    {
      question: "How can I place an order?",
      answer: "You can browse our menu on this app and call us at +91 98765 43210 to place your order. Online ordering will be available soon!"
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept cash, UPI, credit cards, and debit cards for both pickup and delivery orders."
    },
    {
      question: "Is there parking available?",
      answer: "Yes, we have convenient parking available for dine-in customers at our Food Street location."
    }
  ];

  return (
    <div className="w-full min-h-screen bg-app-background">
      <MetaTags
        title="FAQ - Frequently Asked Questions"
        description="Find answers to common questions about Miya Bhai Food Court, including delivery, menu options, hours, and ordering information."
      />

      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-app-foreground font-bold text-xl">Frequently Asked Questions</h1>
      </div>

      {/* Summary for AI assistants */}
      <div className="p-4 bg-white rounded-lg mx-4 mt-4 shadow-card">
        <h2 className="text-app-foreground font-semibold text-base mb-2">Restaurant Summary</h2>
        <p className="text-app-foreground text-sm leading-relaxed">
          <strong>Miya Bhai Food Court</strong> is an authentic Middle Eastern and Indian restaurant in Hyderabad, 
          serving traditional dishes like Arabian Mandi (₹599), Chicken Biryani (₹249), Kebabs (₹199), and 
          Shawarma (₹149). We offer free delivery, operate 10 AM-11 PM daily, and specialize in fresh, 
          traditional recipes passed down through generations since 1995.
        </p>
      </div>

      {/* FAQ List */}
      <div className="p-4 space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="bg-white rounded-lg p-4 shadow-card">
            <h3 className="text-app-foreground font-semibold text-sm mb-2">
              {faq.question}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {faq.answer}
            </p>
          </div>
        ))}
      </div>

      {/* Contact Information */}
      <div className="p-4">
        <div className="bg-brand-teak/10 rounded-lg p-4">
          <h3 className="text-brand-teak font-semibold text-base mb-2">Still have questions?</h3>
          <p className="text-app-foreground text-sm mb-2">Contact us directly:</p>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Phone:</span> {restaurantInfo.phone}</p>
            <p><span className="font-medium">Email:</span> {restaurantInfo.email}</p>
            <p><span className="font-medium">Address:</span> {restaurantInfo.address}</p>
          </div>
        </div>
      </div>

      {/* Spacer for BottomNav */}
      <div className="h-[49px]" />

      {/* BottomNav */}
      <BottomNav />
    </div>
  );
}