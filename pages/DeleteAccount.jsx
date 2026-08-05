import React from "react";

const DeleteAccount = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f9f4ef] via-[#fff] to-[#f2f2f2] py-12 px-4 sm:px-6 lg:px-8 text-[#AE2108]">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center mb-4 text-[#AE2108]">
          Delete Your Account
        </h1>

        {[
          {
            title: "1. How to Request Deletion",
            content: (
              <p className="text-base leading-relaxed">
                To request deletion of your ChowSpace account and associated
                data, send an email to{" "}
                <a
                  href="mailto:tomotelechristopher25@gmail.com?subject=Account%20Deletion%20Request"
                  className="underline hover:text-[#881a06]"
                >
                  tomotelechristopher25@gmail.com
                </a>{" "}
                from the email address registered on your account, with the
                subject line "Account Deletion Request". Include your full
                name and registered phone number so we can locate your
                account.
              </p>
            ),
          },
          {
            title: "2. What Gets Deleted",
            content: (
              <ul className="list-disc pl-5 space-y-1">
                <li>Your account profile (name, email, phone number)</li>
                <li>Saved delivery addresses and location preferences</li>
                <li>Chat message history with vendors</li>
                <li>Favorite vendors and app preferences</li>
              </ul>
            ),
          },
          {
            title: "3. What May Be Retained",
            content: (
              <p className="text-base leading-relaxed">
                Records of past orders (items, amounts, and delivery details)
                may be retained for a limited period as required for
                accounting, tax, and dispute-resolution purposes, even after
                your account is deleted. This information is kept separately
                from your active account and is not used for any other
                purpose.
              </p>
            ),
          },
          {
            title: "4. How Long It Takes",
            content: (
              <p className="text-base leading-relaxed">
                We process deletion requests within{" "}
                <span className="font-medium">7 days</span> of receiving your
                email. You'll get a confirmation once your account and
                associated data have been deleted.
              </p>
            ),
          },
          {
            title: "5. Questions",
            content: (
              <p className="text-base leading-relaxed">
                If you have questions about this process, reach out to us at{" "}
                <a
                  href="mailto:tomotelechristopher25@gmail.com"
                  className="underline hover:text-[#881a06]"
                >
                  tomotelechristopher25@gmail.com
                </a>
                .
              </p>
            ),
          },
        ].map((section, index) => (
          <div
            key={index}
            className="bg-white border border-[#f2f2f2] rounded-xl shadow-md p-6"
          >
            <h2 className="text-2xl font-semibold mb-2">{section.title}</h2>
            <div className="text-[#AE2108]">{section.content}</div>
          </div>
        ))}

        <footer className="text-center text-sm text-gray-400 pt-8">
          &copy; {new Date().getFullYear()} ChowSpace. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default DeleteAccount;
