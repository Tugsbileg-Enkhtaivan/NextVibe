"use client";

import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { BASE_URL } from "../../../contants";
import { toast } from "sonner";
import { useAuth, useUser } from "@clerk/nextjs";

type ValueType = {
  email: string;
  username: string;
};

const Test = () => {
const [users, setUsers] = useState([])

  const { user } = useUser();
  // console.log(user) -- uhaj uzvel neleen yum garna
  const { getToken } = useAuth();

  const getUsers = async () => {
    const token = await getToken();
    console.log({ token });

    fetch(`${BASE_URL}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        // console.log(data)
        setUsers(data)
      })
  }

  useEffect(() => {
    getUsers()
  }, [])

  const formSchema = z.object({
    email: z.string().email(),
    username: z.string(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      username: "",
    },
  });

  const onSubmit = async (value: ValueType) => {
    const response = await axios.post(`${BASE_URL}/users`, {
      email: value.email,
      username: value.username,
    });

    toast(`${response.data.message}`)

  };

  return (
    <div className="w-1/2 space-y-6 px-30 py-20">
      <h1>Burtgelgui huuhdiin odriin temdeglel</h1>
      <b>{user?.fullName}</b>
      <br />
      <b>{user?.id}</b>
      <br />
      <b>{user?.primaryEmailAddress?.emailAddress}</b>
      <div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter email here" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Enter password here" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full mt-3">
              Continue
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default Test;
