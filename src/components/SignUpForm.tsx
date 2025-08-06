"use client";
import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Briefcase, UserRound } from "lucide-react";
import Link from "next/link";

const SignUpForm = () => {
  const [form, setForm] = useState({
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
  });
  const [type, setType] = useState<"owner" | "student">("owner");
  const [onStemp, setOnStemp] = useState(0);

  const onNext = () => {
    setOnStemp((prev: number) => prev + 1);
  };
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Tell us about yourself! What do you do? Let’s tailor your experience so
          it best suits you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {onStemp == 0 && (
          <div className="flex flex-col gap-3">
            <div
              className={cn(
                "flex justify-center items-center gap-3 border-2 p-4 rounded-lg cursor-pointer",
                type == "owner" && "border-orange-400"
              )}
              onClick={() => {
                setType("owner");
              }}
            >
              <div className="w-12 h-12 rounded-lg bg-orange-200 flex justify-center items-center">
                <Briefcase />
              </div>
              <div>
                <h2 className="font-bold">I own a business</h2>
                <p>Setting up my account for my company.</p>
              </div>
            </div>
            <div
              className={cn(
                "flex justify-center items-center gap-3 border-2 p-4 rounded-lg cursor-pointer",
                type == "student" && "border-orange-400"
              )}
              onClick={() => {
                setType("student");
              }}
            >
              <div className="w-12 h-12 rounded-lg bg-orange-200 flex justify-center items-center">
                <UserRound />
              </div>
              <div>
                <h2 className="font-bold">Im a student</h2>
                <p>Looking to learn about the tool.</p>
              </div>
            </div>
            <Button
              className="w-full text-white bg-black mt-5"
              onClick={() => onNext()}
            >
              Continue
            </Button>
            <p className="text-center">
              Already have an account?{" "}
              <Link href="/login" className="font-bold cursor-pointer">
                Sign In
              </Link>
            </p>
            <div className="flex w-full pt-5 pb-2 gap-1">
              <div className="h-2 rounded-md bg-orange-400 w-1/2"></div>
              <div
                className={`h-2 rounded-md ${onStemp >= 1 ? "bg-orange-400" : "bg-gray-200"
                  } w-1/2`}
              ></div>
            </div>
          </div>
        )}

        {onStemp == 1 && (
          <div className="flex flex-col gap-3">
            <h1 className="font-bold text-2xl">Account details</h1>
            <p>Enter your email and password</p>
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                placeholder="Full name"
                id="name"
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                placeholder="Email"
                id="email"
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                placeholder="Password"
                type="password"
                id="password"
                onChange={(e) =>
                  setForm({
                    ...form,
                    password: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Confirm Password</Label>
              <Input
                placeholder="Confirm Password"
                type="password"
                id="password"
                onChange={(e) =>
                  setForm({
                    ...form,
                    confirmPassword: e.target.value,
                  })
                }
              />
            </div>
            <Button
              className="w-full text-white bg-black mt-5"
              onClick={() => { }}
            >
              Continue
            </Button>
            <p className="text-center">
              Already have an account?{" "}
              <Link href="/login" className="font-bold cursor-pointer">
                Sign In
              </Link>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
export default SignUpForm; 