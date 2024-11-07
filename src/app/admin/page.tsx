"use client";
import React, { useState, useEffect } from "react";
import { PlanType } from "@prisma/client";

interface User {
  id: string;
  name: string;
  email: string;
  planType: PlanType | null;
  isActive: boolean;
  planEndTime: string | null;
  createdAt: string;
  updatedAt: string;
}

const PlanTypes: PlanType[] = ["Daily", "Monthly", "Yearly", "Expired"];

const calculatePlanEndTime = (planType: PlanType): string => {
  const now = new Date();
  switch (planType) {
    case "Daily":
      return new Date(now.setDate(now.getDate() + 1)).toISOString();
    case "Monthly":
      return new Date(now.setMonth(now.getMonth() + 1)).toISOString();
    case "Yearly":
      return new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();
    case "Expired":
      return "";
  }
};

const formatDateTime = (dateString: string | null): string => { 
  return dateString ? new Date(dateString).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "N/A"; 
}; 
const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const response = await fetch("/api/users");
      const data = await response.json();
      setUsers(data);
    };
    fetchUsers();
  }, []);

  const handleEditClick = (userId: string) => {
    setEditingUserId(userId);
  };

  const handlePlanTypeChange = (userId: string, newPlanType: PlanType) => {
    const newPlanEndTime = calculatePlanEndTime(newPlanType);
    setUsers(
      users.map((user) =>
        user.id === userId
          ? { ...user, planType: newPlanType, planEndTime: newPlanEndTime }
          : user
      )
    );
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(
      users.map((user) =>
        user.id === userId
          ? {
              ...user,
              isActive: !user.isActive,
              planType: !user.isActive ? "Expired" : user.planType,
              planEndTime: !user.isActive ? null : user.planEndTime,
            }
          : user
      )
    );
  };

  const handleSave = async (userId: string) => {
    setIsSaving(true);
    const updatedUser = users.find((user) => user.id === userId);

    if (!updatedUser) {
      console.error("User not found");
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/users/updateUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: updatedUser.id,
          planType: updatedUser.planType,
          planEndTime: updatedUser.planEndTime,
          isActive: updatedUser.isActive,
        }),
      });
      if (!response.ok) throw new Error("Failed to update user");

      const savedUser = await response.json();
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === savedUser.id ? savedUser : u))
      );
      setEditingUserId(null);
    } catch (error) {
      console.error("Failed to save changes:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingUserId(null);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">User Management</h2>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Plan Type</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Plan End Time</th>
              <th className="p-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="p-2">{user.name}</td>
                <td className="p-2">{user.email}</td>
                <td className="p-2">
                  {editingUserId === user.id ? (
                    <select
                      value={user.planType || ""}
                      onChange={(e) =>
                        handlePlanTypeChange(user.id, e.target.value as PlanType)
                      }
                      className="bg-gray-900 p-1 rounded"
                    >
                      <option value="" disabled>
                        Select Plan
                      </option>
                      {PlanTypes.filter((plan) => plan !== "Expired").map(
                        (plan) => (
                          <option key={plan} value={plan}>
                            {plan}
                          </option>
                        )
                      )}
                    </select>
                  ) : (
                    user.planType || "N/A"
                  )}
                </td>
                <td className="p-2">
                  <button
                    onClick={() => toggleUserStatus(user.id)}
                    className={`px-2 py-1 rounded-full ${
                      user.isActive ? "bg-green-600" : "bg-red-600"
                    }`}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="p-2">{formatDateTime(user.planEndTime)}</td>
                <td className="p-2">
                  {editingUserId === user.id ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSave(user.id)}
                        className="px-4 py-2 bg-blue-500 text-white rounded"
                      >
                        {isSaving ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 bg-gray-300 text-black rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEditClick(user.id)}
                      className="px-4 py-2 bg-gray-700 text-white rounded"
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {users.map((user) => (
          <div key={user.id} className="border p-4 rounded-lg shadow">
            <div className="mb-2">
              <strong>Name:</strong> {user.name}
            </div>
            <div className="mb-2">
              <strong>Email:</strong> {user.email}
            </div>
            <div className="mb-2">
              <strong>Plan Type:</strong>{" "}
              {editingUserId === user.id ? (
                <select
                  value={user.planType || ""}
                  onChange={(e) =>
                    handlePlanTypeChange(user.id, e.target.value as PlanType)
                  }
                  className="bg-gray-900 p-1 rounded w-full"
                >
                  <option value="" disabled>
                    Select Plan
                  </option>
                  {PlanTypes.filter((plan) => plan !== "Expired").map((plan) => (
                    <option key={plan} value={plan}>
                      {plan}
                    </option>
                  ))}
                </select>
              ) : (
                user.planType || "N/A"
              )}
            </div>
            <div className="mb-2">
              <strong>Status:</strong>{" "}
              <button
                onClick={() => toggleUserStatus(user.id)}
                className={`px-2 py-1 rounded-full ${
                  user.isActive ? "bg-green-600" : "bg-red-600"
                }`}
              >
                {user.isActive ? "Active" : "Inactive"}
              </button>
            </div>
            <div className="mb-2">
              <strong>Plan End Time:</strong> {formatDateTime(user.planEndTime)}
            </div>
            <div>
              {editingUserId === user.id ? (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleSave(user.id)}
                    className="px-4 py-2 bg-blue-500 text-white rounded w-full"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-300 text-black rounded w-full"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleEditClick(user.id)}
                  className="px-4 py-2 bg-gray-700 text-white rounded w-full"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPage;
