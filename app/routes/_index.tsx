import { useActionMutation, useActionQuery, writeClientAppState } from "@agent-native/core/client/hooks";
import {
  IconActivity,
  IconArrowUpRight,
  IconBarbell,
  IconBell,
  IconBrain,
  IconChartBar,
  IconChevronRight,
  IconClock,
  IconCreditCard,
  IconFlame,
  IconHeart,
  IconMessageCircle,
  IconSearch,
  IconUpload,
  IconUsers,
  IconHome,
  IconMenu2,
  IconPlus,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { TAB_ID } from "@/lib/tab-id";

export function meta() {
  return [
    { title: "FITORA — Train with purpose" },
    { name: "description", content: "Your training, nutrition, and progress in one place." },
  ];
}

type Role = "Member" | "Trainer" | "Gym Owner" | "Super Admin";
type NavItem = { label: string; icon: typeof IconHome };

const navByRole: Record<Role, NavItem[]> = {
  Member: [
    { label: "Overview", icon: IconHome }, { label: "Workouts", icon: IconBarbell },
    { label: "Community", icon: IconUsers }, { label: "Nutrition", icon: IconFlame },
    { label: "Activity", icon: IconActivity }, { label: "Profile", icon: IconUser },
  ],
  Trainer: [
    { label: "Overview", icon: IconHome }, { label: "Clients", icon: IconUser },
    { label: "Plans", icon: IconBarbell }, { label: "Sessions", icon: IconClock },
    { label: "Client progress", icon: IconChartBar }, { label: "Follow-ups", icon: IconBell },
    { label: "Messages", icon: IconBrain }, { label: "Profile", icon: IconUser },
  ],
  "Gym Owner": [
    { label: "Overview", icon: IconHome }, { label: "Members", icon: IconUser },
    { label: "Trainers", icon: IconBarbell }, { label: "Plans", icon: IconCreditCard },
    { label: "Subscriptions", icon: IconCreditCard }, { label: "Revenue", icon: IconChartBar },
    { label: "Analytics", icon: IconActivity }, { label: "Announcements", icon: IconBell },
    { label: "Support", icon: IconBrain }, { label: "Settings", icon: IconUser },
    { label: "Profile", icon: IconUser },
  ],
  "Super Admin": [
    { label: "Overview", icon: IconHome }, { label: "Gyms", icon: IconBarbell },
    { label: "Users", icon: IconUser }, { label: "Plans", icon: IconCreditCard },
    { label: "Transactions", icon: IconActivity }, { label: "Analytics", icon: IconChartBar },
    { label: "Support", icon: IconBrain }, { label: "Settings", icon: IconBell },
    { label: "Profile", icon: IconUser },
  ],
};

const formatNumber = (value: number) => new Intl.NumberFormat("en-IN").format(Math.round(value));

function getWorkoutStreak(workouts: any[]) {
  const dates = new Set(workouts.filter((workout) => !workout.isDemo).map((workout) => new Date(workout.completedAt).toDateString()));
  const day = new Date();
  day.setHours(0, 0, 0, 0);
  if (!dates.has(day.toDateString())) day.setDate(day.getDate() - 1);
  let streak = 0;
  while (dates.has(day.toDateString())) {
    streak += 1;
    day.setDate(day.getDate() - 1);
  }
  return streak;
}

function MetricCard({ label, value, unit, icon: Icon, color = "blue", detail }: {
  label: string; value: string | number; unit?: string; icon: typeof IconHome; color?: string; detail?: string;
}) {
  return <div className="gym-card rounded-2xl border p-4 sm:p-5">
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-bold uppercase tracking-[.16em] text-slate-400">{label}</span>
      <span className={`metric-icon metric-${color}`}><Icon size={18} stroke={1.8} /></span>
    </div>
    <div className="mt-5 flex items-baseline gap-1.5"><strong className="text-[27px] font-extrabold tracking-tight text-slate-100">{value}</strong>{unit && <span className="text-xs text-slate-400">{unit}</span>}</div>
    {detail && <p className="mt-1 text-xs text-slate-400">{detail}</p>}
  </div>;
}

function SectionTitle({ title, right }: { title: string; right?: React.ReactNode }) {
  return <div className="mb-4 flex items-center justify-between"><h2 className="text-[15px] font-bold tracking-tight text-slate-100">{title}</h2>{right}</div>;
}

export default function HomeRoute() {
  const [role, setRole] = useState<Role>("Member");
  const [active, setActive] = useState("Overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [toast, setToast] = useState("");
  const firedReminder = useRef(new Set<string>());
  const [membership, setMembership] = useState("Premium");
  const [scanFileName, setScanFileName] = useState("");
  const profileQuery = useActionQuery("get-fitness-profile", {});
  const updateProfile = useActionMutation("update-fitness-profile");
  const profile = profileQuery.data ?? null;
  const workoutsQuery = useActionQuery("list-workout-logs", {});
  const mealsQuery = useActionQuery("list-meal-logs", {});
  const activityQuery = useActionQuery("list-activity-logs", {});
  const communityQuery = useActionQuery("list-community", {});
  const createWorkout = useActionMutation("create-workout-log");
  const createMeal = useActionMutation("create-meal-log");
  const createActivity = useActionMutation("create-activity-log");
  const updateActivity = useActionMutation("update-activity-log");
  const deleteActivity = useActionMutation("delete-activity-log");
  const createPost = useActionMutation("create-community-post");
  const createComment = useActionMutation("create-community-comment");
  const toggleLike = useActionMutation("toggle-community-like");
  const setMembershipAction = useActionMutation("set-group-membership");
  const workouts = workoutsQuery.data ?? [];
  const meals = mealsQuery.data ?? [];
  const activity = activityQuery.data ?? [];
  const communityData = communityQuery.data ?? { groups: [], posts: [], comments: [], likeCounts: {}, myLikedPostIds: [], memberships: [] };
  const community = { ...communityData, groups: communityData.groups.map((group) => ({ ...group, name: group.name.replace("TT Fit App", "FITORA") })) };
  const todayKey = new Date().toDateString();
  const todayMeals = meals.filter((meal) => new Date(meal.loggedAt).toDateString() === todayKey);
  const calories = todayMeals.reduce((sum, meal) => sum + meal.calories, 0);
  const protein = todayMeals.reduce((sum, meal) => sum + meal.protein, 0);
  const carbs = todayMeals.reduce((sum, meal) => sum + meal.carbs, 0);
  const fats = todayMeals.reduce((sum, meal) => sum + meal.fats, 0);
  useEffect(() => {
    void writeClientAppState("navigation", { view: "home", path: "/", section: active, role }, { requestSource: TAB_ID });
  }, [active, role]);
  const navItems = navByRole[role];
  const isDemoData = workouts.some((item) => item.isDemo) || meals.some((item) => item.isDemo) || activity.some((item) => item.isDemo);
  const recentWorkouts = useMemo(() => workouts.slice(0, 4), [workouts]);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }, []);

  useEffect(() => {
    if (!profile) return;
    const checkReminders = () => {
      const now = new Date();
      const minuteOfDay = now.getHours() * 60 + now.getMinutes();
      const dayKey = now.toDateString();
      const due: string[] = [];
      if (profile.waterReminderEnabled) {
        const start = Number(profile.waterReminderTime.slice(0, 2)) * 60 + Number(profile.waterReminderTime.slice(3));
        const interval = profile.waterReminderIntervalHours * 60;
        if (minuteOfDay >= start && (minuteOfDay - start) % interval === 0) due.push("Time for a water break.");
      }
      if (profile.mealReminderEnabled) {
        const start = Number(profile.mealReminderTime.slice(0, 2)) * 60 + Number(profile.mealReminderTime.slice(3));
        const interval = Math.floor((1440 - start) / profile.mealReminderPerDay);
        if (Array.from({ length: profile.mealReminderPerDay }, (_, index) => start + index * interval).includes(minuteOfDay)) due.push("A meal reminder is scheduled for now.");
      }
      due.forEach((message) => {
        const key = `${dayKey}:${message}:${minuteOfDay}`;
        if (firedReminder.current.has(key)) return;
        firedReminder.current.add(key);
        if ("Notification" in window && Notification.permission === "granted") new Notification("FITORA", { body: message });
        else notify(message);
      });
    };
    checkReminders();
    const timer = window.setInterval(checkReminders, 15_000);
    return () => window.clearInterval(timer);
  }, [profile, notify]);

  function saveCompletedWorkout(workout: { title: string; focus: string; durationMins: number }) {
    createWorkout.mutate(workout, {
      onSuccess: () => notify("Workout summary saved to your training history."),
      onError: () => notify("Could not save workout. Please try again."),
    });
  }

  function submitMeal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    createMeal.mutate({ title: String(form.get("title")), mealType: String(form.get("mealType")) as "Breakfast" | "Lunch" | "Dinner" | "Snack", calories: Number(form.get("calories")), protein: Number(form.get("protein") || 0), carbs: Number(form.get("carbs") || 0), fats: Number(form.get("fats") || 0) }, {
      onSuccess: () => { formElement.reset(); notify("Meal added to your diary."); },
      onError: () => notify("Could not save meal. Please try again."),
    });
  }

  function submitActivity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const metric = String(form.get("metric")) as "steps" | "weight" | "water" | "waist" | "chest" | "hip";
    const units = { steps: "steps", weight: "kg", water: "L", waist: "cm", chest: "cm", hip: "cm" } as const;
    createActivity.mutate({ metric, value: Number(form.get("value")), unit: units[metric] }, {
      onSuccess: () => { formElement.reset(); notify("Activity update saved."); },
      onError: () => notify("Could not save activity. Please try again."),
    });
  }

  function saveReminders(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    updateProfile.mutate({
      waterReminderEnabled: form.get("waterReminderEnabled") === "on",
      waterReminderTime: String(form.get("waterReminderTime")),
      waterReminderIntervalHours: Number(form.get("waterReminderIntervalHours")),
      mealReminderEnabled: form.get("mealReminderEnabled") === "on",
      mealReminderTime: String(form.get("mealReminderTime")),
      mealReminderPerDay: Number(form.get("mealReminderPerDay")),
    }, {
      onSuccess: () => notify("Reminder preferences saved."),
      onError: () => notify("Could not save reminder preferences."),
    });
  }

  function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const optionalNumber = (key: string) => {
      const value = String(form.get(key) ?? "").trim();
      return value ? Number(value) : null;
    };
    const optionalText = (key: string) => String(form.get(key) ?? "").trim() || null;
    updateProfile.mutate({
      displayName: optionalText("displayName"),
      ...(role === "Member" ? {
        age: optionalNumber("age"),
        heightCm: optionalNumber("heightCm"),
        fitnessGoal: optionalText("fitnessGoal"),
        waterReminderEnabled: form.get("waterReminderEnabled") === "on",
        waterReminderTime: String(form.get("waterReminderTime")),
        waterReminderIntervalHours: Number(form.get("waterReminderIntervalHours")),
        mealReminderEnabled: form.get("mealReminderEnabled") === "on",
        mealReminderTime: String(form.get("mealReminderTime")),
        mealReminderPerDay: Number(form.get("mealReminderPerDay")),
      } : {
        contactEmail: optionalText("contactEmail"),
        contactPhone: optionalText("contactPhone"),
        profilePhotoUrl: optionalText("profilePhotoUrl"),
        ...(role === "Trainer" ? {
          specialization: optionalText("specialization"),
          qualifications: optionalText("qualifications"),
          experienceYears: optionalNumber("experienceYears"),
          professionalDetails: optionalText("professionalDetails"),
        } : role === "Gym Owner" ? {
          gymName: optionalText("gymName"),
          gymAddress: optionalText("gymAddress"),
          businessDetails: optionalText("businessDetails"),
        } : {
          administratorDetails: optionalText("administratorDetails"),
        }),
      }),
    }, {
      onSuccess: () => {
        if (role === "Member") {
          const latest = new Map<string, any>();
          activity.filter((entry) => !entry.isDemo).forEach((entry) => { if (!latest.has(entry.metric)) latest.set(entry.metric, entry); });
          const measurementUnits = { weight: "kg", waist: "cm", chest: "cm", hip: "cm" } as const;
          (Object.keys(measurementUnits) as (keyof typeof measurementUnits)[]).forEach((metric) => {
            const value = optionalNumber(metric);
            const previous = latest.get(metric);
            const onError = () => notify(`Profile saved, but the ${metric} measurement could not be updated.`);
            if (value === null && previous) deleteActivity.mutate({ id: previous.id }, { onError });
            else if (value !== null && value !== previous?.value) {
              if (previous) updateActivity.mutate({ id: previous.id, value, unit: measurementUnits[metric] }, { onError });
              else createActivity.mutate({ metric, value, unit: measurementUnits[metric] }, { onError });
            }
          });
        }
        notify(role === "Member" ? "Profile and reminder preferences saved." : `${role} profile saved.`);
      },
      onError: () => notify("Could not save profile. Please try again."),
    });
  }

  const primary = "rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-300 disabled:cursor-wait disabled:opacity-60";
  const field = "w-full rounded-xl border border-[#333740] bg-[#17191d] px-3.5 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-400 focus:border-amber-400/70";
  const sectionContent = () => {
    if (active === "Profile") return <ProfilePanel profile={profile} profileLoading={profileQuery.isPending || activityQuery.isPending} activity={activity} workouts={workouts} saving={updateProfile.isPending || createActivity.isPending || updateActivity.isPending || deleteActivity.isPending} onSubmit={saveProfile} onRemindersSubmit={saveReminders} membership={membership} setMembership={setMembership} notify={notify} role={role} />;
    if (role !== "Member") return <RoleOverview role={role} active={active} notify={notify} />;
    if (active === "Workouts") return <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
      <div className="space-y-5"><WorkoutRunner pending={createWorkout.isPending} onComplete={saveCompletedWorkout} /><div className="gym-card rounded-2xl border p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-bold text-slate-100">Form correction</h2><p className="mt-1 text-xs text-slate-400">Live technique analysis is unavailable because pose estimation is not configured.</p></div><button type="button" disabled title="Pose-estimation integration required" className="rounded-lg border border-[#333740] px-3 py-2 text-xs font-semibold text-slate-500 disabled:cursor-not-allowed">Unavailable</button></div></div><MuscleMap workouts={workouts} /></div>
      <div className="gym-card rounded-2xl border p-5 sm:p-6"><SectionTitle title="Recent sessions" /><WorkoutList workouts={recentWorkouts} /></div>
    </div>;
    if (active === "Nutrition") return <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <div className="space-y-5"><div className="gym-card rounded-2xl border p-5 sm:p-6"><SectionTitle title="Food diary" right={<label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#333740] px-3 py-2 text-xs font-bold text-slate-300 hover:bg-[#1d2025]"><IconUpload size={15} />Scan food<input className="sr-only" type="file" accept="image/*" capture="environment" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) { setScanFileName(file.name); notify("Image selected. Food recognition is not configured; enter nutrition manually."); } }} /></label>} /><p className="mb-4 text-xs text-slate-400">Food image scan · demo placeholder only. No AI estimate is generated.</p>{scanFileName && <p className="mb-3 truncate rounded-lg bg-amber-400/10 px-3 py-2 text-xs text-amber-200">Selected image: {scanFileName}</p>}<form onSubmit={submitMeal} className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5 text-xs text-slate-400 sm:col-span-2">Food or meal<input className={field} name="title" required maxLength={100} placeholder="e.g. Paneer rice bowl" /></label>
        <label className="space-y-1.5 text-xs text-slate-400">Meal<select className={field} name="mealType"><option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option></select></label>
        <label className="space-y-1.5 text-xs text-slate-400">Calories<input className={field} name="calories" type="number" min="0" max="10000" required placeholder="450" /></label>
        <label className="space-y-1.5 text-xs text-slate-400">Protein (g)<input className={field} name="protein" type="number" min="0" step=".1" placeholder="30" /></label>
        <label className="space-y-1.5 text-xs text-slate-400">Carbs (g)<input className={field} name="carbs" type="number" min="0" step=".1" placeholder="45" /></label>
        <label className="space-y-1.5 text-xs text-slate-400 sm:col-span-2">Fats (g)<input className={field} name="fats" type="number" min="0" step=".1" placeholder="12" /></label>
        <button className={`${primary} sm:col-span-2`} disabled={createMeal.isPending}>{createMeal.isPending ? "Saving meal…" : "Save meal"}</button>
      </form></div></div>
      <div className="gym-card rounded-2xl border p-5 sm:p-6"><SectionTitle title="Today's nutrition" /><MacroSummary calories={calories} protein={protein} carbs={carbs} fats={fats} /><div className="mt-5 space-y-3"><MealList meals={meals.slice(0, 6)} /></div></div>
    </div>;
    if (active === "Community") return <CommunityPanel data={community} onCreatePost={(groupId, content) => createPost.mutate({ groupId, content }, { onSuccess: () => notify("Post shared with the group."), onError: () => notify("Could not post. Check group access and try again.") })} onComment={(postId, body) => createComment.mutate({ postId, body }, { onSuccess: () => notify("Comment added."), onError: () => notify("Could not comment on this post.") })} onLike={(postId, liked) => toggleLike.mutate({ postId, liked }, { onError: () => notify("Could not update like.") })} onMembership={(groupId, joined) => setMembershipAction.mutate({ groupId, joined }, { onSuccess: (result) => notify(result.status === "requested" ? "Private group request saved." : result.status === "joined" ? "You joined the group." : "You left the group."), onError: () => notify("Could not update group membership.") })} />;
    if (active === "Activity") return <ActivityAnalyticsPanel activity={activity} workouts={workouts} meals={meals} submitActivity={submitActivity} pending={createActivity.isPending} field={field} primary={primary} />;
    if (active === "AI Coach") return <CoachPanel workouts={workouts} meals={meals} activity={activity} protein={protein} isDemoData={isDemoData} />;
    if (active === "Membership" || active === "Rewards") return <ProfilePanel profile={profile} profileLoading={profileQuery.isPending || activityQuery.isPending} activity={activity} workouts={workouts} saving={updateProfile.isPending || createActivity.isPending || updateActivity.isPending || deleteActivity.isPending} onSubmit={saveProfile} onRemindersSubmit={saveReminders} membership={membership} setMembership={setMembership} notify={notify} role={role} />;
    return <MemberOverview calories={calories} protein={protein} carbs={carbs} fats={fats} workouts={workouts} meals={todayMeals} activity={activity} isDemoData={isDemoData} onNavigate={setActive} />;
  };

  return <div className="dark min-h-screen bg-[#0c0d0f] text-slate-200">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[250px] flex-col border-r border-[#333740] bg-[#17191d] px-4 py-5 lg:flex">
      <Brand onHome={() => setActive("Overview")} />
      <div className="mt-8 rounded-xl border border-[#333740] bg-[#1d2025] p-3">
        <label className="mb-2 block text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Explore workspace</label>
        <select aria-label="Choose a demo role" value={role} onChange={(event) => { setRole(event.target.value as Role); setActive("Overview"); }} className="w-full cursor-pointer bg-transparent text-sm font-semibold text-slate-100 outline-none">
          <option className="bg-[#17191d]">Member</option><option className="bg-[#17191d]">Trainer</option><option className="bg-[#17191d]">Gym Owner</option><option className="bg-[#17191d]">Super Admin</option>
        </select>
      </div>
      <p className="mb-2 mt-8 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Workspace</p>
      <nav className="flex-1 space-y-1 overflow-y-auto">{navItems.map(({ label, icon: Icon }) => <NavButton key={label} label={label} icon={Icon} active={active === label} onClick={() => setActive(label)} />)}</nav>
      <div className="mt-4 rounded-xl border border-amber-400/15 bg-amber-400/[.06] p-3.5"><p className="text-xs font-bold text-amber-300">FITORA · Demo</p><p className="mt-1 text-[11px] leading-relaxed text-slate-400">Role switcher is for product preview. Access controls need configuration.</p></div>
    </aside>
    <div className="lg:pl-[250px]">
      <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-[#333740] bg-[#121417]/95 px-4 backdrop-blur-xl sm:px-7 lg:px-9">
        <div className="flex items-center gap-3"><button className="rounded-lg p-2 text-slate-300 hover:bg-[#272a30] lg:hidden" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><IconMenu2 size={20} /></button><Brand onHome={() => setActive("Overview")} /><div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex"><span>Workspace</span><IconChevronRight size={13} /><span className="text-slate-200">{active}</span></div></div>
        <div className="flex items-center gap-3"><div className="hidden items-center gap-2 rounded-full border border-[#333740] bg-[#1d2025] px-3 py-2 text-[11px] text-slate-400 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Demo data enabled</div><div className="relative"><button onClick={() => setNotificationsOpen((open) => !open)} className="relative rounded-xl border border-[#333740] p-2.5 text-slate-300 hover:bg-[#272a30]" aria-label="Notifications" aria-expanded={notificationsOpen} aria-controls="notifications-panel"><IconBell size={17} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-amber-400" /></button>{notificationsOpen && <div id="notifications-panel" role="region" aria-label="Notifications" className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-[#333740] bg-[#17191d] p-4 shadow-2xl"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold text-slate-100">Notifications</h2><button type="button" onClick={() => setNotificationsOpen(false)} className="rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-[#272a30]" aria-label="Close notifications">Close</button></div>{role === "Member" ? <div className="rounded-lg border border-amber-400/15 bg-amber-400/[.06] p-3"><p className="text-[9px] font-bold uppercase tracking-wide text-amber-300">Gym Owner · Announcement</p><p className="mt-1.5 text-xs leading-5 text-slate-200">Our gym is organising a Diwali event on 1 November 2026!</p></div> : <p className="text-xs text-slate-400">You&apos;re all caught up.</p>}</div>}</div><button onClick={() => setActive("Profile")} className="flex items-center gap-2 rounded-full border border-[#333740] py-1 pl-1 pr-3 text-left transition hover:bg-[#272a30]" aria-label="Open profile"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-xs font-extrabold text-slate-950">{profile?.displayName?.trim() ? profile.displayName.trim().slice(0, 1).toUpperCase() : <IconUser size={16} />}</span><span className="hidden max-w-32 truncate text-xs font-semibold text-slate-200 sm:inline">{profile?.displayName || "Profile"}</span></button></div>
      </header>
      <main className="mx-auto max-w-[1500px] px-4 pb-28 pt-7 sm:px-7 sm:pt-9 lg:px-9 lg:pb-10">
        {role === "Member" && active === "Overview" && <div className="mb-5"><CoachAdviceCard workouts={workouts} activity={activity} fitnessGoal={profile?.fitnessGoal ?? null} onNavigate={setActive} /></div>}
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-[10px] font-bold uppercase tracking-[.2em] text-amber-300">{role} workspace</p>{(active !== "Overview" || role === "Member") && <h1 className="text-[27px] font-extrabold tracking-[-.04em] text-slate-100 sm:text-[32px]">{active === "Overview" ? "Overview" : active}<span className="text-amber-500">.</span></h1>}<p className="mt-1.5 text-sm text-slate-400">{role === "Member" ? "You’re building momentum. Keep showing up." : `FITORA ${role.toLowerCase()} command center`}</p></div><div className="flex items-center gap-2">{(role !== "Member" || active === "Workouts") && <button onClick={() => setActive(role === "Member" ? "Workouts" : navItems[1]?.label ?? "Overview")} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 transition hover:bg-amber-300"><IconPlus size={15} />{role === "Member" ? "Log workout" : `Open ${navItems[1]?.label ?? "workspace"}`}</button>}</div></div>
        {isDemoData && role === "Member" && <div className="mb-5 flex items-center gap-2 rounded-xl border border-amber-400/15 bg-amber-400/[.06] px-3.5 py-2.5 text-xs text-amber-200/80"><span className="h-1.5 w-1.5 rounded-full bg-amber-400/100" />Illustrative demo records are labeled in your logs. New entries save to your account.</div>}
        {workoutsQuery.isError || mealsQuery.isError || activityQuery.isError || communityQuery.isError ? <div className="mb-5 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">Some account data could not be loaded. Refresh to retry.</div> : null}
        {sectionContent()}
      </main>
    </div>
    {mobileOpen && <div className="fixed inset-0 z-50 bg-black/70 lg:hidden" onClick={() => setMobileOpen(false)}><div className="h-full w-[min(84vw,320px)] border-r border-[#333740] bg-[#17191d] p-4" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><Brand onHome={() => { setActive("Overview"); setMobileOpen(false); }} /><button className="rounded-lg p-2 text-slate-400" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><IconX size={19} /></button></div><label className="mb-2 mt-8 block text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Demo role</label><select aria-label="Choose a demo role" value={role} onChange={(event) => { setRole(event.target.value as Role); setActive("Overview"); setMobileOpen(false); }} className="w-full rounded-lg border border-[#333740] bg-[#1d2025] p-3 text-sm text-slate-100"><option>Member</option><option>Trainer</option><option>Gym Owner</option><option>Super Admin</option></select><nav className="mt-5 space-y-1">{navItems.map(({ label, icon: Icon }) => <NavButton key={label} label={label} icon={Icon} active={active === label} onClick={() => { setActive(label); setMobileOpen(false); }} />)}</nav></div></div>}
    <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-[#333740] bg-[#121417]/95 px-1 pb-[max(.4rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden">{navItems.slice(0, 5).map(({ label, icon: Icon }) => <button key={label} onClick={() => setActive(label)} className={`flex flex-col items-center gap-1 rounded-lg py-1.5 text-[9px] font-semibold ${active === label ? "text-amber-300" : "text-slate-400"}`}><Icon size={19} stroke={1.7} />{label}</button>)}<button onClick={() => setMobileOpen(true)} className="absolute -top-12 right-4 flex h-10 w-10 items-center justify-center rounded-full border border-[#333740] bg-[#17191d] text-slate-200 shadow-xl" aria-label="More navigation"><IconMenu2 size={17} /></button></nav>
    {toast && <div role="status" className="fixed bottom-20 left-1/2 z-[60] -translate-x-1/2 rounded-xl border border-[#333740] bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-2xl lg:bottom-6">{toast}</div>}
  </div>;
}

function Brand({ onHome }: { onHome: () => void }) {
  return <button type="button" onClick={onHome} aria-label="FITORA home" className="flex items-center gap-2.5 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"><img src="https://cdn.builder.io/api/v1/image/assets%2F11630002cc3f46038fc2d444ebe23686%2F82069e8796864905a678f2c07e0b7361?format=webp&width=800&height=1200" alt="FITORA logo" className="h-12 w-16 shrink-0 rounded-xl object-contain" /><div><p className="text-[13px] font-black tracking-[.13em] text-slate-100">FITORA</p><p className="mt-0.5 text-[9px] font-bold uppercase tracking-[.19em] text-slate-400">Train with purpose</p></div></button>;
}

function NavButton({ label, icon: Icon, active, onClick }: { label: string; icon: typeof IconHome; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition ${active ? "bg-amber-400/10 text-amber-300" : "text-slate-400 hover:bg-[#272a30] hover:text-slate-200"}`}><Icon size={18} stroke={1.8} />{label}{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-400/100" />}</button>;
}

function CoachAdviceCard({ workouts, activity, fitnessGoal, onNavigate }: { workouts: any[]; activity: any[]; fitnessGoal?: string | null; onNavigate: (page: string) => void }) {
  const personalWorkouts = workouts.filter((workout) => !workout.isDemo).sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  const latestWorkout = personalWorkouts[0];
  const workoutStreak = getWorkoutStreak(personalWorkouts);
  const hoursSinceWorkout = latestWorkout ? (Date.now() - new Date(latestWorkout.completedAt).getTime()) / 3_600_000 : null;
  const personalActivity = activity.filter((entry) => !entry.isDemo);
  const latestSteps = personalActivity.find((entry) => entry.metric === "steps");
  const latestWater = personalActivity.find((entry) => entry.metric === "water");
  const needsRecovery = hoursSinceWorkout !== null && hoursSinceWorkout < 24;
  const recommendation = !latestWorkout
    ? "Start with a manageable session and save your workout summary."
    : needsRecovery
      ? "Choose a light recovery session or an easy walk today."
      : workoutStreak >= 3
        ? `Your ${workoutStreak}-day workout streak shows real consistency. Keep today’s session manageable and recover well.`
        : "Schedule a training session that supports your stated goal and log it when finished.";
  const explanation = latestWorkout
    ? `Your last saved workout was ${latestWorkout.focus.toLowerCase()} ${hoursSinceWorkout !== null && hoursSinceWorkout < 48 ? "within the past two days" : "in your recorded history"}.${fitnessGoal ? ` Your stated goal is ${fitnessGoal}.` : " Add a fitness goal in Profile for more relevant guidance."}`
    : `No personal workout summaries are recorded yet.${fitnessGoal ? ` Your stated goal is ${fitnessGoal}.` : " Add a goal in Profile when you are ready."}`;
  return <section className="gym-card rounded-2xl border border-amber-400/25 bg-gradient-to-r from-amber-400/[.08] to-transparent p-5 sm:p-6" aria-labelledby="coach-advice-title"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300"><IconBrain size={20} /></span><div><div className="flex flex-wrap items-center gap-2"><h2 id="coach-advice-title" className="text-base font-extrabold text-slate-100">Today’s Advice by Your AI Coach</h2><span className="rounded-full bg-amber-400/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-amber-300">Rule-based demo · no AI API</span></div><p className="mt-2 text-sm font-bold text-amber-200">{recommendation}</p><p className="mt-1.5 max-w-3xl text-xs leading-5 text-slate-400">{explanation}{latestSteps ? ` Recent steps logged: ${formatNumber(latestSteps.value)}.` : " No personal step records are available."}{latestWater ? ` Latest water log: ${latestWater.value} ${latestWater.unit}.` : " No personal water log is available."}</p><p className="mt-2 text-[10px] text-slate-500">Uses saved workout summaries and activity logs. Exercise-level completions and recovery records are not stored; no AI API is connected.</p></div></div><button onClick={() => onNavigate(needsRecovery ? "Activity" : "Workouts")} className="rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 hover:bg-amber-300">{needsRecovery ? "Open recovery tracking" : "Open workouts"}</button></div></section>;
}

function MemberOverview({ calories, protein, carbs, fats, workouts, meals, activity, isDemoData, onNavigate }: {
  calories: number; protein: number; carbs: number; fats: number; workouts: any[]; meals: any[]; activity: any[]; isDemoData: boolean; onNavigate: (page: string) => void;
}) {
  const steps = activity.find((entry) => entry.metric === "steps" && !entry.isDemo)?.value ?? 0;
  const workoutStreak = getWorkoutStreak(workouts);
  const workoutsThisWeek = workouts.filter((workout) => !workout.isDemo && Date.now() - new Date(workout.completedAt).getTime() <= 7 * 86400000).length;
  return <div className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Calories" value={formatNumber(calories)} unit="/ 2,200 kcal" icon={IconFlame} detail="Based on meals logged today" /><MetricCard label="Protein" value={`${formatNumber(protein)}g`} icon={IconActivity} color="violet" detail={`Carbs ${formatNumber(carbs)}g · Fats ${formatNumber(fats)}g`} /><MetricCard label="Steps" value={formatNumber(steps)} icon={IconActivity} color="green" detail="Daily movement" /><MetricCard label="Workouts" value={workouts.length} unit="sessions" icon={IconBarbell} color="orange" detail="Training history" /></div>
    <div className="grid gap-5 xl:grid-cols-[1.45fr_.8fr]">
      <div className="gym-card overflow-hidden rounded-2xl border p-5 sm:p-6"><SectionTitle title="Today's training" right={<button onClick={() => onNavigate("Workouts")} className="flex items-center gap-1 text-xs font-bold text-amber-300 hover:text-amber-300">Workout planner <IconArrowUpRight size={14} /></button>} /><div className="relative overflow-hidden rounded-xl border border-[#333740] bg-[#1d2025] p-5 sm:p-6"><div className="absolute -right-5 -top-8 h-44 w-44 rounded-full border-[24px] border-amber-400/[.04]" /><div className="relative flex flex-wrap items-start justify-between gap-5"><div><div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-amber-300"><IconBarbell size={13} />Strength · Intermediate</div><h3 className="mt-4 text-xl font-extrabold text-slate-100">Upper body power</h3><p className="mt-1 max-w-md text-xs leading-5 text-slate-400">Build strength with a focused push and pull session, followed by a short mobility reset.</p><div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400"><span className="inline-flex items-center gap-1.5"><IconClock size={14} />45 min</span><span>6 exercises</span><span>~320 kcal</span></div></div><button onClick={() => onNavigate("Workouts")} className="rounded-xl bg-amber-400 px-4 py-3 text-xs font-extrabold text-slate-950 hover:bg-amber-300">Start workout</button></div></div><div className="mt-5"><SectionTitle title="Recent sessions" right={<span className="text-[10px] text-slate-400">{isDemoData ? "Includes illustrative demo data" : "Your logged sessions"}</span>} /><WorkoutList workouts={workouts.slice(0, 3)} /></div></div>
      <div className="space-y-5"><div className="gym-card rounded-2xl border p-5"><SectionTitle title="Nutrition today" right={<button onClick={() => onNavigate("Nutrition")} className="text-xs font-bold text-amber-300">Add meal</button>} /><MacroSummary calories={calories} protein={protein} carbs={carbs} fats={fats} /><div className="mt-4 space-y-2"><MealList meals={meals.slice(0, 3)} /></div></div><div className="gym-card rounded-2xl border p-5"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/100/10 text-amber-300"><IconBrain size={18} /></span><div><div className="flex items-center gap-2"><h3 className="text-sm font-bold text-slate-100">Coach note</h3><span className="rounded-full bg-amber-400/100/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-300">Rule-based demo</span></div><p className="mt-2 text-xs leading-5 text-slate-400">{protein < 100 ? "Your logged protein is below the 100g demo target. Consider adding a protein-rich snack after your next session." : "You’re close to your demo protein target. Keep hydration steady and prioritize recovery after training."}</p><button onClick={() => onNavigate("AI Coach")} className="mt-3 text-xs font-bold text-amber-300 hover:text-slate-100">Open fitness coach <IconChevronRight className="inline" size={13} /></button></div></div></div></div>
    </div>
    <div className="grid gap-5 xl:grid-cols-[1.45fr_.8fr]"><div className="gym-card rounded-2xl border p-5 sm:p-6"><SectionTitle title="Weekly consistency" right={<span className="text-xs text-slate-400">Illustrative activity</span>} /><div className="flex h-32 items-end justify-between gap-3 px-1 pt-4">{[{ d: "M", h: 42 }, { d: "T", h: 72 }, { d: "W", h: 58 }, { d: "T", h: 88 }, { d: "F", h: 48 }, { d: "S", h: 100 }, { d: "S", h: 30 }].map((bar, i) => <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><div className={`w-full max-w-10 rounded-t-md ${i === 5 ? "bg-amber-400" : "bg-amber-400/20"}`} style={{ height: `${bar.h}%` }} /><span className="text-[10px] text-slate-400">{bar.d}</span></div>)}</div><div className="mt-3 flex items-center gap-2 text-xs text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" />{workoutsThisWeek} workouts this week <span className="ml-auto font-bold text-slate-100">{workoutStreak} day streak</span></div></div><div className="gym-card flex flex-col justify-between rounded-2xl border p-5 sm:p-6"><div><div className="flex items-center justify-between"><h2 className="text-[15px] font-bold text-slate-100">Your membership</h2><span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300">ACTIVE</span></div><p className="mt-4 text-2xl font-extrabold text-slate-100">Premium <span className="text-sm font-medium text-slate-400">· ₹499/mo</span></p><p className="mt-1 text-xs text-slate-400">Demo membership · renews 28 Jul 2025</p></div><button onClick={() => onNavigate("Membership")} className="mt-5 flex items-center justify-between rounded-xl border border-[#333740] px-3.5 py-3 text-xs font-bold text-slate-300 hover:bg-[#272a30]">Manage membership <IconChevronRight size={15} /></button></div></div>
  </div>;
}

function MacroSummary({ calories, protein, carbs, fats }: { calories: number; protein: number; carbs: number; fats: number }) {
  const caloriePct = Math.min(calories / 2200 * 100, 100);
  return <><div className="flex items-end justify-between"><div><p className="text-2xl font-extrabold text-slate-100">{formatNumber(calories)} <span className="text-xs font-medium text-slate-400">kcal</span></p><p className="mt-1 text-[11px] text-slate-400">of 2,200 daily target</p></div><span className="text-xs font-bold text-amber-300">{Math.round(caloriePct)}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#272a30]"><div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${caloriePct}%` }} /></div><div className="mt-4 grid grid-cols-3 gap-2">{[["Protein", protein, "bg-amber-400"], ["Carbs", carbs, "bg-amber-400"], ["Fats", fats, "bg-amber-300"]].map(([name, amount, color]) => <div key={String(name)} className="rounded-lg bg-[#1d2025] p-2.5"><span className={`mb-2 block h-1 w-5 rounded-full ${color}`} /><p className="text-[10px] text-slate-400">{name}</p><p className="mt-0.5 text-xs font-bold text-slate-100">{formatNumber(Number(amount))}g</p></div>)}</div></>;
}

function WorkoutList({ workouts }: { workouts: any[] }) {
  if (!workouts.length) return <p className="rounded-xl bg-[#1d2025] px-3 py-4 text-center text-xs text-slate-400">No workouts logged yet. Add your first session to start tracking.</p>;
  return <div className="space-y-2">{workouts.map((workout) => <div key={workout.id} className="flex items-center gap-3 rounded-xl bg-[#1d2025] px-3 py-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400/10 text-amber-300"><IconBarbell size={17} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-xs font-bold text-slate-200">{workout.title}</p>{workout.isDemo && <span className="rounded-full bg-[#272a30] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-slate-400">Demo</span>}</div><p className="mt-1 text-[10px] text-slate-400">{workout.focus} · {workout.durationMins} min</p></div><span className="text-[10px] text-slate-400">{new Date(workout.completedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span></div>)}</div>;
}

function MealList({ meals }: { meals: any[] }) {
  if (!meals.length) return <p className="py-3 text-center text-xs text-slate-400">No meals logged yet.</p>;
  return <>{meals.map((meal) => <div key={meal.id} className="flex items-center justify-between gap-2 border-b border-[#333740] pb-2 last:border-0 last:pb-0"><div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate text-xs font-semibold text-slate-300">{meal.title}</p>{meal.isDemo && <span className="text-[8px] font-bold uppercase text-slate-400">Demo</span>}</div><p className="mt-0.5 text-[10px] text-slate-400">{meal.mealType} · {formatNumber(meal.protein)}g protein</p></div><span className="shrink-0 text-xs font-bold text-slate-300">{formatNumber(meal.calories)} kcal</span></div>)}</>;
}

function WorkoutRunner({ pending, onComplete }: { pending: boolean; onComplete: (workout: { title: string; focus: string; durationMins: number }) => void }) {
  const exercises = ["Barbell bench press", "Seated cable row", "Dumbbell shoulder press", "Leg press", "Plank"];
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(20);
  const [rest, setRest] = useState(60);
  const [focus, setFocus] = useState("Upper body");
  const [running, setRunning] = useState(false);
  const [resting, setResting] = useState(false);
  const [restLeft, setRestLeft] = useState(0);
  const [completedSets, setCompletedSets] = useState(0);
  const [exerciseSetsCompleted, setExerciseSetsCompleted] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [summary, setSummary] = useState("");
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setElapsedSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running]);
  useEffect(() => {
    if (!running || !resting) return;
    const timer = window.setInterval(() => setRestLeft((seconds) => {
      if (seconds <= 1) { setResting(false); return 0; }
      return seconds - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [running, resting]);
  const startSession = () => { setStartedAt(Date.now()); setElapsedSeconds(0); setCompletedSets(0); setExerciseSetsCompleted(0); setRunning(true); setSummary(""); };
  const completeSet = () => {
    setCompletedSets((count) => count + 1);
    setExerciseSetsCompleted((count) => count + 1);
    setRestLeft(rest);
    setResting(true);
  };
  const finishSession = () => {
    const durationMins = Math.max(1, Math.round(elapsedSeconds / 60));
    setRunning(false);
    setResting(false);
    setSummary(`${completedSets} sets · ${durationMins} min`);
    onComplete({ title: `${focus} workout`, focus, durationMins });
    setStartedAt(null);
  };
  const replaceExercise = (direction: 1 | -1) => {
    setExerciseIndex((index) => (index + direction + exercises.length) % exercises.length);
    setExerciseSetsCompleted(0);
  };
  return <div className="gym-card rounded-2xl border p-5 sm:p-6">
    <SectionTitle title="Start exercise" right={<span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold text-amber-200">{running ? "SESSION LIVE" : "READY"}</span>} />
    {summary && !running && <p className="mb-4 rounded-xl bg-emerald-400/10 px-3 py-2.5 text-xs font-semibold text-emerald-200">Workout summary: {summary}</p>}
    <div className="rounded-xl border border-[#333740] bg-[#1d2025] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">Exercise {exerciseIndex + 1} of {exercises.length}</p><h3 className="mt-1 text-lg font-extrabold text-slate-100">{exercises[exerciseIndex]}</h3></div><div className="flex flex-wrap items-center gap-2"><label className="text-[10px] font-semibold text-slate-400">Training focus<select aria-label="Training focus" value={focus} onChange={(event) => setFocus(event.target.value)} className="ml-2 rounded-lg border border-[#333740] bg-[#17191d] px-2 py-2 text-xs text-slate-200"><option>Upper body</option><option>Chest</option><option>Back</option><option>Arms</option><option>Abs</option><option>Glutes</option><option>Legs</option><option>Full body</option></select></label><button onClick={() => replaceExercise(-1)} aria-label="Previous exercise" className="rounded-lg border border-[#333740] bg-[#17191d] px-3 py-2 text-xs font-bold">‹</button><button onClick={() => replaceExercise(1)} className="rounded-lg border border-[#333740] bg-[#17191d] px-3 py-2 text-xs font-bold">Replace exercise</button></div></div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{([{ label: "Sets", value: sets, setter: setSets, min: 1, max: 10 }, { label: "Reps", value: reps, setter: setReps, min: 1, max: 100 }, { label: "Weight · kg", value: weight, setter: setWeight, min: 0, max: 500 }, { label: "Rest · sec", value: rest, setter: setRest, min: 0, max: 600 }] as { label: string; value: number; setter: React.Dispatch<React.SetStateAction<number>>; min: number; max: number }[]).map(({ label, value, setter, min, max }) => <label key={label} className="text-[10px] font-semibold text-slate-400">{label}<input aria-label={label} className="mt-1 w-full rounded-lg border border-[#333740] bg-[#17191d] px-2.5 py-2 text-sm font-bold text-slate-100 outline-none focus:border-amber-500" type="number" min={min} max={max} value={value} onChange={(event) => setter(Number(event.target.value))} /></label>)}</div>
      <div className="mt-4 flex flex-wrap items-center gap-2"><button className="rounded-lg border border-[#333740] bg-[#17191d] px-3 py-2 text-xs font-semibold text-slate-400" onClick={() => setRunning((value) => !value)} disabled={!startedAt}>{running ? "Pause" : startedAt ? "Resume" : "Paused"}</button>{resting && <div className="rounded-lg bg-amber-400/15 px-3 py-2 text-xs font-extrabold text-amber-200">Rest {Math.floor(restLeft / 60)}:{String(restLeft % 60).padStart(2, "0")} <button onClick={() => setResting(false)} className="ml-2 underline">Skip</button></div>}<span className="ml-auto text-xs text-slate-400">Session {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, "0")} · set {Math.min(exerciseSetsCompleted + 1, sets)} of {sets}</span><span className="text-xs text-slate-400">Total completed: <b className="text-slate-200">{completedSets}</b></span></div>
      <div className="mt-4 flex flex-wrap gap-2">{!startedAt ? <button className="rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 hover:bg-amber-300" onClick={startSession} disabled={pending}>Start workout</button> : <><button className="rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 hover:bg-amber-300 disabled:opacity-50" onClick={completeSet} disabled={!running || resting || exerciseSetsCompleted >= sets}>Complete set</button><button className="rounded-xl border border-[#333740] bg-[#17191d] px-4 py-2.5 text-xs font-bold text-slate-300" onClick={() => replaceExercise(1)}>Next exercise</button><button className="ml-auto rounded-xl border border-[#333740] px-4 py-2.5 text-xs font-bold text-slate-400" disabled={pending} onClick={finishSession}>{pending ? "Saving…" : "Finish workout"}</button></>}</div>
    </div>
  </div>;
}

const muscleGroups = ["Chest", "Shoulders", "Back", "Arms", "Abs", "Glutes", "Legs"];
function MuscleMap({ workouts }: { workouts: any[] }) {
  const [selected, setSelected] = useState("Chest");
  const groupsFromLog = new Set<string>();
  workouts.forEach((workout) => {
    const focus = `${workout.focus} ${workout.title}`.toLowerCase();
    if (focus.includes("upper") || focus.includes("push") || focus.includes("chest")) ["Chest", "Shoulders", "Arms"].forEach((group) => groupsFromLog.add(group));
    if (focus.includes("lower") || focus.includes("leg")) ["Glutes", "Legs"].forEach((group) => groupsFromLog.add(group));
    if (focus.includes("back") || focus.includes("pull")) ["Back", "Arms"].forEach((group) => groupsFromLog.add(group));
    if (focus.includes("full body")) muscleGroups.forEach((group) => groupsFromLog.add(group));
    if (focus.includes("chest")) groupsFromLog.add("Chest");
    if (focus.includes("shoulder")) groupsFromLog.add("Shoulders");
    if (focus.includes("abs")) groupsFromLog.add("Abs");
    if (focus.includes("glute")) groupsFromLog.add("Glutes");
  });
  const region = (group: string, x: number, y: number, width: number, height: number, rx = 9) => <rect key={`${group}-${x}-${y}`} x={x} y={y} width={width} height={height} rx={rx} className={`muscle-region ${groupsFromLog.has(group) ? "muscle-hit" : ""} ${selected === group ? "muscle-selected" : ""}`} onClick={() => setSelected(group)} role="button" tabIndex={0} aria-label={`${group}${groupsFromLog.has(group) ? ", included in logged workout focus" : ", no logged workout focus"}`} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelected(group); } }} />;
  return <div className="gym-card rounded-2xl border p-5 sm:p-6"><SectionTitle title="Muscle map" right={<span className="text-[10px] text-slate-400">Based on logged workout focus</span>} /><div className="grid grid-cols-2 gap-3">
    {(["Front", "Back"] as const).map((side) => <div key={side} className="rounded-xl bg-[#1d2025] p-3"><p className="mb-2 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">{side}</p><svg viewBox="0 0 180 230" className="mx-auto h-52 w-full max-w-[180px]" role="img" aria-label={`${side} muscle group illustration`}><circle cx="90" cy="22" r="16" className="body-base" /><rect x="80" y="38" width="20" height="13" rx="5" className="body-base" /><path d="M56 52 Q90 42 124 52 L115 119 Q90 130 65 119 Z" className="body-base" /><path d="M58 55 Q44 58 39 84 L30 123 Q28 132 36 134 Q43 136 47 127 L61 90 Z" className="body-base" /><path d="M122 55 Q136 58 141 84 L150 123 Q152 132 144 134 Q137 136 133 127 L119 90 Z" className="body-base" /><path d="M67 117 Q90 128 113 117 L108 139 Q90 147 72 139 Z" className="body-base" /><path d="M72 139 L89 141 L85 194 Q82 204 75 204 Q68 203 68 195 Z" className="body-base" /><path d="M91 141 L108 139 L112 195 Q111 203 104 204 Q97 204 95 194 Z" className="body-base" />{side === "Front" ? <>{region("Shoulders", 56, 53, 26, 20)}{region("Shoulders", 98, 53, 26, 20)}{region("Chest", 66, 68, 48, 25)}{region("Arms", 37, 78, 14, 42)}{region("Arms", 129, 78, 14, 42)}{region("Abs", 72, 96, 36, 37)}{region("Legs", 69, 146, 17, 49)}{region("Legs", 94, 146, 17, 49)}</> : <>{region("Shoulders", 56, 53, 26, 20)}{region("Shoulders", 98, 53, 26, 20)}{region("Back", 66, 70, 48, 47)}{region("Arms", 37, 78, 14, 42)}{region("Arms", 129, 78, 14, 42)}{region("Glutes", 70, 119, 40, 20)}{region("Legs", 69, 146, 17, 49)}{region("Legs", 94, 146, 17, 49)}</>}</svg></div>)}
    </div><div className="mt-4 flex flex-wrap gap-2">{muscleGroups.map((group) => <button key={group} onClick={() => setSelected(group)} className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold ${selected === group ? "border-amber-400 bg-amber-400/15 text-amber-200" : "border-[#333740] text-slate-400"}`}>{group}{groupsFromLog.has(group) ? " · logged" : ""}</button>)}</div><div className="mt-3 flex items-center gap-4 text-[10px] text-slate-400"><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-[#333740]" />Not in logged focus</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-amber-400" />Logged focus</span><span className="ml-auto font-semibold text-slate-300">Selected: {selected}</span></div><p className="mt-2 text-[10px] text-slate-400">Exercise-level muscle targeting is not recorded in the current workout backend.</p></div>;
}

function ActivityAnalyticsPanel({ activity, workouts, meals, submitActivity, pending, field, primary }: { activity: any[]; workouts: any[]; meals: any[]; submitActivity: (event: React.FormEvent<HTMLFormElement>) => void; pending: boolean; field: string; primary: string }) {
  const [range, setRange] = useState<"Weekly" | "Monthly">("Weekly");
  const days = range === "Weekly" ? 7 : 30;
  const periodMs = days * 86400000;
  const cutoff = Date.now() - periodMs;
  const previousStart = cutoff - periodMs;
  const inRange = (value: string) => new Date(value).getTime() >= cutoff;
  const rangedWorkouts = workouts.filter((item) => inRange(item.completedAt));
  const rangedMeals = meals.filter((item) => inRange(item.loggedAt));
  const rangedActivity = activity.filter((item) => inRange(item.loggedAt));
  const previousWorkouts = workouts.filter((item) => { const time = new Date(item.completedAt).getTime(); return time >= previousStart && time < cutoff; });
  const previousMeals = meals.filter((item) => { const time = new Date(item.loggedAt).getTime(); return time >= previousStart && time < cutoff; });
  const previousActivity = activity.filter((item) => { const time = new Date(item.loggedAt).getTime(); return time >= previousStart && time < cutoff; });
  const total = (metric: string) => rangedActivity.filter((entry) => entry.metric === metric).reduce((sum, entry) => sum + entry.value, 0);
  const last = (metric: string) => rangedActivity.find((entry) => entry.metric === metric);
  const activeMinutes = rangedWorkouts.reduce((sum, item) => sum + item.durationMins, 0);
  const stepTarget = range === "Weekly" ? 56000 : 240000;
  const stepsComplete = Math.min(Math.round(total("steps") / stepTarget * 100), 100);
  const workoutTarget = range === "Weekly" ? 4 : 16;
  const workoutComplete = Math.min(Math.round(rangedWorkouts.length / workoutTarget * 100), 100);
  const scale = Math.max(1, rangedWorkouts.length, Math.round(total("steps") / 1000), Math.round(total("water") * 2));
  const bucketCount = range === "Weekly" ? 7 : 5;
  const bucketMs = periodMs / bucketCount;
  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const end = Date.now() - (bucketCount - 1 - index) * bucketMs;
    const start = end - bucketMs;
    const count = rangedWorkouts.filter((workout) => { const date = new Date(workout.completedAt).getTime(); return date >= start && date <= end; }).length;
    return { label: range === "Weekly" ? new Date(end).toLocaleDateString("en", { weekday: "short" }) : `W${index + 1}`, count };
  });
  const hasRecords = rangedWorkouts.length > 0 || rangedMeals.length > 0 || rangedActivity.length > 0;
  const trendSeries = [
    { label: "Steps", unit: "steps", values: rangedActivity.filter((entry) => entry.metric === "steps").map((entry) => entry.value) },
    { label: "Water", unit: "L", values: rangedActivity.filter((entry) => entry.metric === "water").map((entry) => entry.value) },
    { label: "Active minutes", unit: "min", values: rangedWorkouts.map((entry) => entry.durationMins) },
    { label: "Calories", unit: "kcal / meal", values: rangedMeals.map((entry) => entry.calories) },
  ];
  return <div className="space-y-5"><div className="gym-card flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 sm:p-5"><div><h2 className="font-bold text-slate-100">Activity analytics</h2><p className="mt-1 text-xs text-slate-400">Only logged records are charted. Goal targets are illustrative; no sensor data is connected.</p></div><div className="flex rounded-xl bg-[#272a30] p-1">{(["Weekly", "Monthly"] as const).map((option) => <button key={option} onClick={() => setRange(option)} className={`rounded-lg px-3 py-2 text-xs font-bold ${range === option ? "bg-[#17191d] text-amber-200 shadow-sm" : "text-slate-400"}`}>{option}</button>)}</div></div>
    {!hasRecords && <div className="gym-card rounded-2xl border p-8 text-center text-sm text-slate-400">No {range.toLowerCase()} activity logged yet. Add a measurement or complete a workout to start these charts.</div>}
    {hasRecords && <><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Completed workouts" value={rangedWorkouts.length} icon={IconBarbell} detail={`${workoutComplete}% of ${range.toLowerCase()} goal`} /><MetricCard label="Active minutes" value={activeMinutes} unit="min" icon={IconClock} color="orange" detail="From saved workouts" /><MetricCard label="Steps logged" value={formatNumber(total("steps"))} icon={IconActivity} color="green" detail={`Goal progress ${stepsComplete}%`} /><MetricCard label="Water logged" value={`${total("water").toFixed(1)}L`} icon={IconFlame} color="violet" detail="Sum of entered records" /></div>
    <div className="grid gap-5 xl:grid-cols-2"><div className="gym-card rounded-2xl border p-5 sm:p-6"><SectionTitle title={`${range} workout frequency`} /><div className="flex h-40 items-end gap-2 border-b border-[#333740] pb-2">{buckets.map((bucket, index) => <div key={bucket.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><div className={`w-full max-w-12 rounded-t-md ${bucket.count ? "bg-amber-400" : "bg-[#272a30]"}`} style={{ height: `${bucket.count ? Math.max(18, bucket.count / scale * 100) : 4}%` }} /><span className="text-[9px] text-slate-400">{bucket.label}</span></div>)}</div><p className="mt-3 text-xs text-slate-400">{range === "Weekly" ? "Daily sessions this week" : "Sessions grouped by week"}</p></div>
    <div className="gym-card rounded-2xl border p-5 sm:p-6"><SectionTitle title="Goal completion" /><GoalMeter label="Workout target" value={workoutComplete} detail={`${rangedWorkouts.length} / ${workoutTarget} sessions`} /><GoalMeter label="Steps target" value={stepsComplete} detail={`${formatNumber(total("steps"))} / ${formatNumber(stepTarget)} steps`} /><GoalMeter label="Hydration target" value={Math.min(Math.round(total("water") / (range === "Weekly" ? 17.5 : 75) * 100), 100)} detail={`${total("water").toFixed(1)} L recorded`} /></div>
    <div className="gym-card rounded-2xl border p-5 sm:p-6 xl:col-span-2"><SectionTitle title={`${range} activity trends`} /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{trendSeries.map((series) => <TrendBars key={series.label} label={series.label} unit={series.unit} values={series.values} />)}</div></div>
    <div className="gym-card rounded-2xl border p-5 sm:p-6"><SectionTitle title="Weight & measurements" /><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{["weight", "waist", "chest", "hip"].map((metric) => { const entry = last(metric); return <div key={metric} className="rounded-xl bg-[#1d2025] p-3"><p className="text-[10px] capitalize text-slate-400">{metric}</p><p className="mt-1 text-lg font-extrabold text-slate-100">{entry ? formatNumber(entry.value) : "—"}<span className="ml-1 text-[9px] font-medium text-slate-400">{entry?.unit}</span></p></div>; })}</div><TrendCompare values={rangedActivity.filter((entry) => ["weight", "waist", "chest", "hip"].includes(entry.metric)).map((entry) => entry.value)} /></div>
    <div className="gym-card rounded-2xl border p-5 sm:p-6"><SectionTitle title="Nutrition & recovery" /><div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#1d2025] p-4"><p className="text-[10px] text-slate-400">Average calories / meal</p><p className="mt-1 text-xl font-extrabold text-slate-100">{rangedMeals.length ? formatNumber(rangedMeals.reduce((sum, meal) => sum + meal.calories, 0) / rangedMeals.length) : "—"}<span className="ml-1 text-[10px] font-medium text-slate-400">kcal</span></p></div><div className="rounded-xl bg-[#1d2025] p-4"><p className="text-[10px] text-slate-400">Logged meals</p><p className="mt-1 text-xl font-extrabold text-slate-100">{rangedMeals.length}</p></div></div><div className="mt-4 space-y-1">{rangedMeals.length ? rangedMeals.slice(0, 5).map((meal) => <div key={meal.id} className="flex justify-between border-b border-[#2a2d33] py-2 text-xs"><span className="text-slate-400">{meal.title}{meal.isDemo && <span className="ml-2 text-[9px] uppercase text-slate-400">Demo</span>}</span><span className="font-semibold text-slate-300">{meal.calories} kcal</span></div>) : <p className="text-xs text-slate-400">No meals recorded in this period.</p>}</div></div></div></>}
    <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]"><div className="gym-card rounded-2xl border p-5 sm:p-6"><SectionTitle title="Log activity" /><form onSubmit={submitActivity} className="space-y-3"><label className="block space-y-1.5 text-xs text-slate-400">Metric<select className={field} name="metric"><option value="steps">Steps</option><option value="weight">Weight (kg)</option><option value="water">Water (litres)</option><option value="waist">Waist (cm)</option><option value="chest">Chest (cm)</option><option value="hip">Hip (cm)</option></select></label><label className="block space-y-1.5 text-xs text-slate-400">Value<input className={field} name="value" type="number" step=".1" min=".1" required placeholder="Enter value" /></label><button className={`${primary} w-full`} disabled={pending}>{pending ? "Saving…" : "Save update"}</button></form></div><div className="gym-card rounded-2xl border p-5 sm:p-6"><SectionTitle title="Period comparison" /><PeriodComparison currentWorkouts={rangedWorkouts} previousWorkouts={previousWorkouts} currentMeals={rangedMeals} previousMeals={previousMeals} currentActivity={rangedActivity} previousActivity={previousActivity} /></div></div>
  </div>;
}

function TrendBars({ label, unit, values }: { label: string; unit: string; values: number[] }) {
  const recent = values.slice(0, 7).reverse();
  const max = Math.max(...recent, 1);
  return <div className="rounded-xl bg-[#1d2025] p-3"><div className="flex items-baseline justify-between"><p className="text-xs font-bold text-slate-300">{label}</p><span className="text-[9px] text-slate-500">{unit}</span></div>{recent.length ? <div className="mt-3 flex h-16 items-end gap-1.5">{recent.map((value, index) => <div key={index} title={`${formatNumber(value)} ${unit}`} className="flex-1 rounded-t-sm bg-amber-400" style={{ height: `${Math.max(8, value / max * 100)}%` }} />)}</div> : <p className="mt-4 text-[10px] text-slate-500">No records for this period</p>}<p className="mt-2 text-[9px] text-slate-500">{recent.length} logged entries</p></div>;
}

function PeriodComparison({ currentWorkouts, previousWorkouts, currentMeals, previousMeals, currentActivity, previousActivity }: { currentWorkouts: any[]; previousWorkouts: any[]; currentMeals: any[]; previousMeals: any[]; currentActivity: any[]; previousActivity: any[] }) {
  if (!previousWorkouts.length && !previousMeals.length && !previousActivity.length) return <p className="rounded-xl bg-[#1d2025] p-4 text-xs text-slate-400">No records in the previous period yet. Comparison will appear after more history is logged.</p>;
  const previousMetric = (source: any[], key: string) => source.filter((item) => item.metric === key).reduce((sum, item) => sum + item.value, 0);
  const currentMinutes = currentWorkouts.reduce((sum, workout) => sum + workout.durationMins, 0);
  const previousMinutes = previousWorkouts.reduce((sum, workout) => sum + workout.durationMins, 0);
  const currentCalories = currentMeals.reduce((sum, meal) => sum + meal.calories, 0);
  const previousCalories = previousMeals.reduce((sum, meal) => sum + meal.calories, 0);
  return <div className="grid gap-2 sm:grid-cols-2">{[["Workouts", currentWorkouts.length, previousWorkouts.length], ["Active minutes", currentMinutes, previousMinutes], ["Steps", previousMetric(currentActivity, "steps"), previousMetric(previousActivity, "steps")], ["Water · L", previousMetric(currentActivity, "water"), previousMetric(previousActivity, "water")], ["Calories", currentCalories, previousCalories]].map(([label, current, previous]) => <div key={String(label)} className="rounded-xl bg-[#1d2025] p-3"><p className="text-[10px] text-slate-400">{label}</p><div className="mt-1 flex items-baseline gap-2"><strong className="text-lg font-extrabold text-slate-100">{Number(current).toFixed(String(label).includes("L") ? 1 : 0)}</strong><span className="text-[10px] text-slate-400">vs {Number(previous).toFixed(String(label).includes("L") ? 1 : 0)} previous</span></div></div>)}</div>;
}

function GoalMeter({ label, value, detail }: { label: string; value: number; detail: string }) {
  return <div className="mb-4 last:mb-0"><div className="mb-1.5 flex justify-between text-xs"><span className="font-semibold text-slate-300">{label}</span><span className="text-slate-400">{detail}</span></div><div className="h-2 overflow-hidden rounded-full bg-[#272a30]"><div className="h-full rounded-full bg-amber-400" style={{ width: `${value}%` }} /></div></div>;
}

function TrendCompare({ values }: { values: number[] }) {
  const low = Math.min(...values, 0);
  const high = Math.max(...values, 0);
  if (!values.length) return <p className="my-4 text-xs text-slate-400">Log more data to see a trend comparison.</p>;
  const baseline = values[0] ?? 0;
  const current = values[values.length - 1] ?? baseline;
  const difference = current - baseline;
  return <div className="my-4 flex items-center gap-3 rounded-xl bg-[#1d2025] p-3"><div className="flex h-8 flex-1 items-end gap-1">{values.slice(-12).map((value, index) => <i key={index} className="flex-1 rounded-t-sm bg-amber-400" style={{ height: `${Math.max(15, high === low ? 55 : (value - low) / (high - low) * 85 + 15)}%` }} />)}</div><span className="text-xs font-bold text-slate-300">{difference >= 0 ? "+" : ""}{formatNumber(difference)} trend</span></div>;
}

function CoachPanel({ workouts, meals, activity, protein, isDemoData }: { workouts: any[]; meals: any[]; activity: any[]; protein: number; isDemoData: boolean }) {
  const personalWorkouts = workouts.filter((workout) => !workout.isDemo);
  const workoutStreak = getWorkoutStreak(personalWorkouts);
  const motivation = workoutStreak >= 2 ? `You’ve built a ${workoutStreak}-day workout streak. Keep the rhythm steady and make room for recovery.` : personalWorkouts.length ? `You’ve logged ${personalWorkouts.length} personal workout${personalWorkouts.length === 1 ? "" : "s"}. Every consistent session is progress.` : "Start with one manageable session and log it to build your own training rhythm.";
  return <div className="grid gap-5 xl:grid-cols-[1fr_.85fr]"><div className="gym-card rounded-2xl border p-5 sm:p-7"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/100/10 text-amber-300"><IconBrain size={22} /></span><div><h2 className="text-lg font-extrabold text-slate-100">Your fitness coach</h2><p className="text-xs text-slate-400">Rule-based demo · No external AI connected</p></div></div><div className="mt-6 space-y-3"><div className="rounded-xl border border-[#333740] bg-[#1d2025] p-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-amber-300">Today's guidance</p><p className="mt-2 text-sm leading-6 text-slate-300">{protein < 100 ? "Your diary currently shows room to add protein. Pair a protein-rich snack with your next meal and keep water nearby through training." : "Your logged protein is on track for the demo target. Consider a lighter mobility or recovery session if you trained hard yesterday."}</p></div><div className="rounded-xl border border-[#333740] bg-[#1d2025] p-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-amber-300">Training rhythm</p><p className="mt-2 text-sm leading-6 text-slate-300">{motivation}</p></div></div>{isDemoData && <p className="mt-4 text-[10px] text-slate-400">Some visible history is illustrative demo data; guidance uses the records currently shown.</p>}</div><div className="gym-card rounded-2xl border p-5 sm:p-6"><SectionTitle title="Coach setup" /><div className="space-y-3">{[["Primary goal", "Build strength"], ["Experience", "Intermediate"], ["Equipment", "Full gym access"], ["Limitations", "None reported"]].map(([label, val]) => <div key={label} className="flex items-center justify-between gap-4 border-b border-[#333740] pb-3 last:border-0"><span className="text-xs text-slate-400">{label}</span><span className="text-xs font-semibold text-slate-200">{val}</span></div>)}</div><div className="mt-5 rounded-xl bg-amber-400/100/[.06] p-3 text-xs leading-5 text-amber-200/70">Nutrition suggestions are educational and do not replace advice from a qualified professional.</div><p className="mt-4 text-[10px] text-slate-400">Meals in recent diary: {meals.length}</p></div></div>;
}

function ProfilePanel({ profile, profileLoading, activity, workouts, saving, onSubmit, onRemindersSubmit, membership, setMembership, notify, role }: {
  profile: any;
  profileLoading: boolean;
  activity: any[];
  workouts: any[];
  saving: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onRemindersSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  membership: string;
  setMembership: (plan: string) => void;
  notify: (message: string) => void;
  role: Role;
}) {
  const [section, setSection] = useState<"details" | "membership" | "rewards">("details");
  const personalActivity = activity.filter((entry) => !entry.isDemo);
  const latest = new Map<string, any>();
  personalActivity.forEach((entry) => { if (!latest.has(entry.metric)) latest.set(entry.metric, entry); });
  const weight = latest.get("weight")?.value as number | undefined;
  const heightCm = profile?.heightCm as number | null | undefined;
  const bmi = weight && heightCm ? weight / ((heightCm / 100) ** 2) : null;
  const field = "w-full rounded-xl border border-[#333740] bg-[#17191d] px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-amber-400";
  const tabs = role === "Member" ? [{ id: "details", label: "Personal details" }, { id: "membership", label: "Membership" }, { id: "rewards", label: "Rewards" }] as const : [{ id: "details", label: "Personal details" }] as const;
  async function requestNotifications() {
    if (!("Notification" in window)) {
      notify("Browser notifications are not available here; in-app reminders still work while FITORA is open.");
      return;
    }
    const permission = await Notification.requestPermission();
    notify(permission === "granted" ? "Browser notifications enabled." : "In-app reminders will continue while FITORA is open.");
  }
  return <div className="space-y-5">
    <div className="gym-card rounded-2xl border p-4"><nav role="tablist" aria-label="Profile sections" className="flex flex-wrap gap-2">{tabs.map((tab) => <button key={tab.id} role="tab" aria-selected={section === tab.id} onClick={() => setSection(tab.id)} className={`rounded-xl px-4 py-2.5 text-xs font-bold ${section === tab.id ? "bg-amber-400 text-slate-950" : "text-slate-400 hover:bg-[#272a30] hover:text-slate-100"}`}>{tab.label}</button>)}</nav></div>
    {section === "details" && <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <div className="gym-card rounded-2xl border p-5 sm:p-6">{profileLoading ? <p className="text-sm text-slate-400">Loading your profile…</p> : <form key={`${profile?.id ?? "new-profile"}:${profile?.updatedAt ?? ""}:${["weight", "waist", "chest", "hip"].map((metric) => latest.get(metric)?.value ?? "").join("-")}`} onSubmit={onSubmit} className="space-y-5">
        <div><SectionTitle title="Personal details" /><div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5 text-xs text-slate-400 sm:col-span-2">Name<input className={field} name="displayName" defaultValue={profile?.displayName ?? ""} maxLength={80} placeholder="Your name" /></label>
          {role === "Member" ? <>
            <label className="space-y-1.5 text-xs text-slate-400">Age<input className={field} name="age" type="number" min="1" max="120" defaultValue={profile?.age ?? ""} /></label>
            <label className="space-y-1.5 text-xs text-slate-400">Height · cm<input className={field} name="heightCm" type="number" min="50" max="260" step="0.1" defaultValue={profile?.heightCm ?? ""} /></label>
            <label className="space-y-1.5 text-xs text-slate-400 sm:col-span-2">Fitness goal<input className={field} name="fitnessGoal" maxLength={160} defaultValue={profile?.fitnessGoal ?? ""} placeholder="Add your goal" /></label>
          </> : <>
            <label className="space-y-1.5 text-xs text-slate-400">Contact email<input className={field} name="contactEmail" type="email" maxLength={254} defaultValue={profile?.contactEmail ?? ""} placeholder="name@example.com" /></label>
            <label className="space-y-1.5 text-xs text-slate-400">Contact phone<input className={field} name="contactPhone" type="tel" maxLength={40} defaultValue={profile?.contactPhone ?? ""} placeholder="Phone number" /></label>
            <label className="space-y-1.5 text-xs text-slate-400 sm:col-span-2">Profile photo URL<input className={field} name="profilePhotoUrl" type="url" defaultValue={profile?.profilePhotoUrl ?? ""} placeholder="https://…" /></label>
            {role === "Trainer" ? <>
              <label className="space-y-1.5 text-xs text-slate-400 sm:col-span-2">Specialization<input className={field} name="specialization" maxLength={160} defaultValue={profile?.specialization ?? ""} placeholder="e.g. Strength and conditioning" /></label>
              <label className="space-y-1.5 text-xs text-slate-400 sm:col-span-2">Qualifications<input className={field} name="qualifications" maxLength={500} defaultValue={profile?.qualifications ?? ""} placeholder="Certifications and qualifications" /></label>
              <label className="space-y-1.5 text-xs text-slate-400">Experience · years<input className={field} name="experienceYears" type="number" min="0" max="80" defaultValue={profile?.experienceYears ?? ""} /></label>
              <label className="space-y-1.5 text-xs text-slate-400 sm:col-span-2">Professional details<textarea className={field} name="professionalDetails" rows={3} maxLength={1000} defaultValue={profile?.professionalDetails ?? ""} placeholder="Additional professional details" /></label>
            </> : role === "Gym Owner" ? <>
              <label className="space-y-1.5 text-xs text-slate-400 sm:col-span-2">Gym name<input className={field} name="gymName" maxLength={160} defaultValue={profile?.gymName ?? ""} placeholder="Gym name" /></label>
              <label className="space-y-1.5 text-xs text-slate-400 sm:col-span-2">Gym address<textarea className={field} name="gymAddress" rows={2} maxLength={500} defaultValue={profile?.gymAddress ?? ""} placeholder="Street, city, postal code" /></label>
              <label className="space-y-1.5 text-xs text-slate-400 sm:col-span-2">Business details<textarea className={field} name="businessDetails" rows={3} maxLength={1000} defaultValue={profile?.businessDetails ?? ""} placeholder="Existing business details" /></label>
            </> : <label className="space-y-1.5 text-xs text-slate-400 sm:col-span-2">Administrator details<textarea className={field} name="administratorDetails" rows={3} maxLength={1000} defaultValue={profile?.administratorDetails ?? ""} placeholder="Administrator details" /></label>}
          </>}
        </div></div>
        {role === "Member" && <div><SectionTitle title="Current measurements" /><div className="grid gap-3 sm:grid-cols-2">
          {([ ["weight", "Weight · kg"], ["waist", "Waist · cm"], ["chest", "Chest · cm"], ["hip", "Hip · cm"] ] as const).map(([metric, label]) => <label key={metric} className="space-y-1.5 text-xs text-slate-400">{label}<input className={field} name={metric} type="number" min="0.1" step="0.1" defaultValue={latest.get(metric)?.value ?? ""} placeholder="Not recorded" /></label>)}
        </div><p className="mt-2 text-[10px] text-slate-500">Measurements are saved to your activity history. Demo records are excluded from your personal values.</p></div>}
        <button type="submit" disabled={saving || profileLoading} className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-300 disabled:opacity-50">{saving ? "Saving…" : "Save profile"}</button>
      </form>}</div>
      <div className="space-y-5">{role === "Member" ? <><div className="gym-card rounded-2xl border p-5 sm:p-6"><SectionTitle title="Body metrics" /><div className="rounded-xl bg-[#1d2025] p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">BMI</p><p className="mt-2 text-3xl font-extrabold text-slate-100">{bmi === null ? "—" : bmi.toFixed(1)}</p><p className="mt-1 text-xs text-slate-400">{bmi === null ? "Enter a height and record a personal weight to calculate BMI." : "Calculated from your saved height and latest personal weight."}</p></div><div className="mt-3 grid grid-cols-2 gap-2">{["waist", "chest", "hip"].map((metric) => <div key={metric} className="rounded-xl bg-[#1d2025] p-3"><p className="text-[10px] capitalize text-slate-400">{metric}</p><p className="mt-1 font-bold text-slate-100">{latest.get(metric) ? `${latest.get(metric).value} ${latest.get(metric).unit}` : "Not recorded"}</p></div>)}</div></div><div className="gym-card rounded-2xl border p-5 sm:p-6"><SectionTitle title="Reminders" right={<button type="button" onClick={requestNotifications} className="text-[10px] font-bold text-amber-300 hover:text-amber-200">Enable browser alerts</button>} />{profileLoading ? <p className="text-xs text-slate-400">Loading saved preferences…</p> : <ReminderSettings profile={profile} saving={saving} onSubmit={onRemindersSubmit} field={field} />}</div></> : <div className="gym-card rounded-2xl border p-5 sm:p-6"><SectionTitle title="Profile photo" />{profile?.profilePhotoUrl ? <img src={profile.profilePhotoUrl} alt={`${profile.displayName || role} profile`} className="h-36 w-36 rounded-2xl border border-[#333740] bg-[#1d2025] object-cover" /> : <div className="flex h-36 w-36 items-center justify-center rounded-2xl border border-[#333740] bg-[#1d2025] text-4xl font-bold text-amber-300">{profile?.displayName?.trim()?.slice(0, 1).toUpperCase() || <IconUser size={34} />}</div>}<p className="mt-3 text-xs text-slate-400">Use the photo URL field to update your profile image.</p></div>}</div>
    </div>}
    {role === "Member" && section === "membership" && <div><p className="mb-4 text-xs text-amber-300">Membership options are illustrative in this demo.</p><MembershipPanel membership={membership} setMembership={setMembership} notify={notify} /></div>}
    {role === "Member" && section === "rewards" && <div><p className="mb-4 text-xs text-amber-300">Rank and rewards are illustrative demo values; your workout streak uses personal workout logs.</p><RewardsPanel notify={notify} workouts={workouts} /></div>}
    {role !== "Member" && <p className="text-[10px] text-slate-500">Profile preferences are account-scoped; workspace role switching remains a product preview.</p>}
  </div>;
}

function ReminderSettings({ profile, saving, onSubmit, field }: { profile: any; saving: boolean; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; field: string }) {
  return <form key={`${profile?.id ?? "new-reminders"}:${profile?.updatedAt ?? ""}`} onSubmit={onSubmit} className="space-y-4">
    <label className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-200"><span>Water reminders</span><input name="waterReminderEnabled" type="checkbox" defaultChecked={profile?.waterReminderEnabled ?? false} className="accent-amber-400" /></label>
    <div className="grid grid-cols-2 gap-2"><label className="space-y-1 text-[10px] text-slate-400">First reminder<input className={field} name="waterReminderTime" type="time" defaultValue={profile?.waterReminderTime ?? "09:00"} /></label><label className="space-y-1 text-[10px] text-slate-400">Repeat every<select className={field} name="waterReminderIntervalHours" defaultValue={profile?.waterReminderIntervalHours ?? 2}><option value="1">1 hour</option><option value="2">2 hours</option><option value="3">3 hours</option><option value="4">4 hours</option><option value="6">6 hours</option></select></label></div>
    <label className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-200"><span>Meal reminders</span><input name="mealReminderEnabled" type="checkbox" defaultChecked={profile?.mealReminderEnabled ?? false} className="accent-amber-400" /></label>
    <div className="grid grid-cols-2 gap-2"><label className="space-y-1 text-[10px] text-slate-400">First reminder<input className={field} name="mealReminderTime" type="time" defaultValue={profile?.mealReminderTime ?? "12:00"} /></label><label className="space-y-1 text-[10px] text-slate-400">Reminders per day<select className={field} name="mealReminderPerDay" defaultValue={profile?.mealReminderPerDay ?? 3}><option value="1">1 per day</option><option value="2">2 per day</option><option value="3">3 per day</option><option value="4">4 per day</option><option value="5">5 per day</option><option value="6">6 per day</option></select></label></div>
    <p className="text-[10px] leading-4 text-slate-500">Reminders run while FITORA is open. Browser alerts need permission; otherwise reminders appear in the app.</p>
    <button type="submit" disabled={saving} className="w-full rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-300 disabled:opacity-50">{saving ? "Saving…" : "Save reminders"}</button>
  </form>;
}

function MembershipPanel({ membership, setMembership, notify }: { membership: string; setMembership: (plan: string) => void; notify: (message: string) => void }) {
  return <div className="max-w-4xl space-y-5"><div className="gym-card rounded-2xl border p-5 sm:p-6"><SectionTitle title="Current membership" /><div className="flex flex-wrap items-center justify-between gap-5 rounded-xl border border-amber-400/15 bg-amber-400/[.05] p-5"><div><div className="flex items-center gap-2"><h3 className="text-xl font-extrabold text-slate-100">{membership}</h3><span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[9px] font-bold text-emerald-300">ACTIVE · DEMO</span></div><p className="mt-1 text-xs text-slate-400">Illustrative membership · renewal shown for preview only</p></div><p className="text-2xl font-black text-slate-100">₹{membership === "Premium" ? "499" : "299"}<span className="text-xs font-medium text-slate-400"> / month</span></p></div></div><div className="grid gap-4 sm:grid-cols-2">{[{ name: "Basic", price: "299", copy: "Workouts, nutrition diary, meal recognition demo, and activity tracking.", features: ["Workout planner", "Nutrition diary", "Activity tracking"] }, { name: "Premium", price: "499", copy: "Everything in Basic, plus premium nutrition tools and advanced analytics.", features: ["Everything in Basic", "Barcode + label OCR (not configured)", "Advanced analytics"] }].map((plan) => <div key={plan.name} className={`gym-card rounded-2xl border p-5 ${membership === plan.name ? "border-amber-400/35" : ""}`}><div className="flex items-start justify-between"><div><h3 className="text-lg font-extrabold text-slate-100">{plan.name}</h3><p className="mt-1 text-xs text-slate-400">₹{plan.price} / month</p></div>{membership === plan.name && <span className="rounded-full bg-amber-400/10 px-2 py-1 text-[9px] font-bold text-amber-300">SELECTED</span>}</div><p className="mt-4 text-xs leading-5 text-slate-400">{plan.copy}</p><ul className="mt-4 space-y-2">{plan.features.map((feature) => <li key={feature} className="flex items-center gap-2 text-xs text-slate-300"><span className="h-1 w-1 rounded-full bg-amber-400/100" />{feature}</li>)}</ul><button onClick={() => { if (membership === plan.name) notify("This plan is already selected."); else { setMembership(plan.name); notify(`${plan.name} selected in demo mode. No payment was made.`); } }} className={`mt-5 w-full rounded-xl px-4 py-2.5 text-xs font-extrabold ${membership === plan.name ? "border border-[#333740] text-slate-400" : "bg-amber-400 text-slate-100 hover:bg-amber-300"}`}>{membership === plan.name ? "Current plan" : `Select ${plan.name} · demo only`}</button></div>)}</div><div className="rounded-xl border border-amber-300/10 bg-amber-300/[.04] p-4 text-xs leading-5 text-amber-100/75">Two-day free trial · Razorpay is not configured. Plan selection is illustrative and does not create a subscription or charge a payment method.</div></div>;
}

function RewardsPanel({ notify, workouts }: { notify: (message: string) => void; workouts: any[] }) {
  const workoutStreak = getWorkoutStreak(workouts);
  const earnedRewards = ["Free smoothie", "Guest day pass"];
  return <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]"><div className="gym-card rounded-2xl border p-6"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-amber-300">Member rank · demo</p><p className="mt-2 text-2xl font-black text-slate-100">Gold</p><p className="mt-4 text-[10px] font-bold uppercase tracking-[.18em] text-amber-300">Points · demo</p><p className="mt-1 text-4xl font-black tracking-tight text-slate-100">1,240</p><p className="mt-2 text-xs text-slate-400">Illustrative points balance</p><div className="mt-5 h-2 overflow-hidden rounded-full bg-[#272a30]"><div className="h-full w-[68%] rounded-full bg-amber-400" /></div><p className="mt-2 text-[10px] text-slate-400">260 points to next rank</p><div className="mt-5 rounded-xl bg-[#1d2025] p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Workout streak</p><p className="mt-1 text-2xl font-extrabold text-slate-100">{workoutStreak} days</p><p className="mt-1 text-[10px] text-slate-400">Based on your personal workout log</p></div></div><div className="gym-card rounded-2xl border p-5 sm:p-6"><SectionTitle title="Earned rewards" right={<span className="text-[10px] text-slate-400">{earnedRewards.length} · demo</span>} /><div className="mb-5 space-y-2">{earnedRewards.map((reward) => <div key={reward} className="rounded-xl bg-[#1d2025] p-3"><p className="text-sm font-semibold text-slate-200">{reward}</p><p className="mt-1 text-[10px] text-slate-400">Illustrative earned reward</p></div>)}</div><SectionTitle title="Redeem rewards" /><div className="space-y-3">{[["Free smoothie", "500 pts"], ["Guest day pass", "1,000 pts"], ["₹200 membership credit", "2,000 pts"]].map(([reward, price]) => <div key={reward} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#1d2025] p-3.5"><div><p className="text-sm font-semibold text-slate-200">{reward}</p><p className="mt-1 text-[10px] text-slate-400">{price} · demo reward</p></div><button onClick={() => notify("Reward redemption is illustrative in this draft.")} className="rounded-lg border border-[#333740] px-3 py-2 text-[10px] font-bold text-slate-300 hover:bg-[#272a30]">Redeem</button></div>)}</div><p className="mt-4 text-[10px] text-slate-400">Demo earning rule: 10 points per eligible ₹100 subscription payment. No payment integration is active.</p></div></div>;
}

function CommunityPanel({ data, onCreatePost, onComment, onLike, onMembership }: {
  data: { groups: any[]; posts: any[]; comments: any[]; likeCounts: Record<string, number>; myLikedPostIds: string[]; memberships: { groupId: string; status: string }[] };
  onCreatePost: (groupId: string, content: string) => void;
  onComment: (postId: string, body: string) => void;
  onLike: (postId: string, liked: boolean) => void;
  onMembership: (groupId: string, joined: boolean) => void;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All groups");
  const [selectedGroupId, setSelectedGroupId] = useState("tt-gym-group");
  const [selectedProfile, setSelectedProfile] = useState("");
  const categories = ["All groups", "Gym group", "Beginner", "Muscle building", "Fat loss", "Strength", "Global fitness"];
  const groups = data.groups.filter((group) => (category === "All groups" || group.category === category) && `${group.name} ${group.category}`.toLowerCase().includes(search.toLowerCase()));
  const groupById = (id: string) => data.groups.find((group) => group.id === id);
  const canPost = (groupId: string) => {
    const group = groupById(groupId);
    return group?.visibility === "public" || data.memberships.some((membership) => membership.groupId === groupId && membership.status === "joined");
  };
  const selectedGroup = groupById(selectedGroupId);
  const submitPost = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const content = String(new FormData(form).get("content") ?? "").trim();
    if (content) { onCreatePost(selectedGroupId, content); form.reset(); }
  };
  return <div className="space-y-5">
    <div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]"><div className="gym-card rounded-2xl border p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-extrabold text-slate-100">Your fitness community</h2><p className="mt-1 text-xs text-slate-400">Talk training, share milestones, and find your people.</p></div><span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-amber-200">Sample community</span></div><div className="mt-4 rounded-xl bg-amber-400/10 p-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-amber-200">Fitness tip · demo</p><p className="mt-1.5 text-sm font-semibold leading-5 text-slate-200">Make your next session repeatable: choose a manageable starting load, log it, and build gradually.</p></div></div><div className="gym-card rounded-2xl border p-5 sm:p-6"><SectionTitle title="Community challenge" /><div className="rounded-xl bg-[#1d2025] p-4"><p className="text-sm font-extrabold text-slate-100">Show up 3× this week</p><p className="mt-1 text-xs leading-5 text-slate-400">Demo challenge · log three workouts and celebrate consistency.</p><div className="mt-3 flex items-center justify-between text-[10px] text-slate-400"><span>Sample participants</span><span className="font-bold text-slate-300">42 members</span></div><div className="mt-3 border-t border-[#333740] pt-3"><p className="text-[9px] font-bold uppercase tracking-wide text-amber-200">Gym announcement · demo</p><p className="mt-1 text-xs text-slate-400">Sample community workout · Saturday, 9:00 AM</p></div></div></div></div>
    <div className="grid gap-5 xl:grid-cols-[.85fr_1.15fr]"><div className="gym-card rounded-2xl border p-5 sm:p-6"><SectionTitle title="Find a group" right={<span className="text-[9px] font-bold uppercase text-slate-400">Directory · demo</span>} /><label className="relative block"><IconSearch size={15} className="absolute left-3 top-3.5 text-slate-400" /><input className="w-full rounded-xl border border-[#333740] bg-[#17191d] py-3 pl-9 pr-3 text-xs text-slate-200 outline-none focus:border-amber-500" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search groups" /></label><select className="mt-2 w-full rounded-xl border border-[#333740] bg-[#17191d] px-3 py-2.5 text-xs text-slate-300" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select><div className="mt-4 max-h-[520px] space-y-2 overflow-y-auto">{groups.map((group) => {
      const membership = data.memberships.find((item) => item.groupId === group.id);
      const isJoined = membership?.status === "joined";
      const isRequested = membership?.status === "requested";
      return <div key={group.id} className={`rounded-xl border p-3.5 ${selectedGroupId === group.id ? "border-amber-400/50 bg-amber-400/10" : "border-[#333740]"}`}><button onClick={() => setSelectedGroupId(group.id)} className="block w-full text-left"><div className="flex items-start justify-between gap-2"><span className="text-xs font-bold text-slate-200">{group.name}</span><span className="shrink-0 rounded-full bg-[#272a30] px-2 py-0.5 text-[8px] font-bold uppercase text-slate-400">{group.visibility}</span></div><p className="mt-1 text-[10px] leading-4 text-slate-400">{group.description}</p><p className="mt-1.5 text-[9px] text-slate-400">{formatNumber(group.memberCount)} sample members · {group.category}</p></button><div className="mt-2 flex items-center justify-between"><span className="text-[8px] font-bold uppercase tracking-wide text-amber-300">Sample group</span><button onClick={() => onMembership(group.id, !isJoined && !isRequested)} className="rounded-lg border border-[#333740] bg-[#17191d] px-2.5 py-1.5 text-[10px] font-bold text-slate-300 hover:bg-[#1d2025]">{isJoined ? "Leave" : isRequested ? "Cancel request" : group.visibility === "private" ? "Request to join" : "Join group"}</button></div></div>;
    })}{groups.length === 0 && <p className="py-8 text-center text-xs text-slate-400">No groups match that search.</p>}</div><p className="mt-3 text-[9px] leading-4 text-slate-400">All directory counts and sample accounts are illustrative; no influencer partnerships are verified.</p></div>
    <div className="space-y-5"><div className="gym-card rounded-2xl border p-5 sm:p-6"><SectionTitle title="Group posts" right={<span className="text-[10px] text-slate-400">{selectedGroup?.name ?? "Select a group"}</span>} />{selectedProfile && <div role="dialog" aria-label="Community member profile" className="mb-4 flex items-center justify-between rounded-xl bg-amber-400/10 p-3"><div><p className="text-xs font-bold text-slate-200">{selectedProfile}</p><p className="mt-1 text-[10px] text-slate-400">{data.posts.filter((post) => post.authorName === selectedProfile).length} visible posts · sample profile, not verified</p></div><button onClick={() => setSelectedProfile("")} className="rounded-lg px-2 py-1 text-xs text-slate-400">Close</button></div>}{selectedGroup && canPost(selectedGroupId) ? <form onSubmit={submitPost} className="mb-5"><label className="sr-only" htmlFor="community-post">Write a post</label><textarea id="community-post" name="content" required maxLength={1200} rows={3} className="w-full resize-y rounded-xl border border-[#333740] bg-[#17191d] p-3 text-sm text-slate-200 outline-none placeholder:text-slate-400 focus:border-amber-500" placeholder={`Share something with ${selectedGroup.name}…`} /><button className="mt-2 rounded-lg bg-amber-400 px-3.5 py-2 text-xs font-extrabold text-slate-950 hover:bg-amber-300">Share post</button></form> : <p className="mb-4 rounded-xl bg-[#1d2025] p-3 text-xs text-slate-400">{selectedGroup?.visibility === "private" ? "Join the group to view or post. Private membership requests need owner approval." : "Select a group to see its posts."}</p>}
    <div className="space-y-3">{data.posts.filter((post) => post.groupId === selectedGroupId).map((post) => {
      const comments = data.comments.filter((comment) => comment.postId === post.id);
      const liked = data.myLikedPostIds.includes(post.id);
      return <article key={post.id} className="rounded-xl border border-[#333740] p-4"><div className="flex items-start justify-between gap-3"><div><button onClick={() => setSelectedProfile(post.authorName)} className="text-left text-xs font-bold text-slate-200 hover:text-amber-300">{post.authorName}</button><p className="mt-1 text-[9px] text-slate-400">{post.isDemo ? "Sample post" : new Date(post.createdAt).toLocaleDateString()}</p></div><span className="text-[9px] font-bold uppercase text-slate-400">{groupById(post.groupId)?.name}</span></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">{post.content}</p><div className="mt-3 flex items-center gap-3"><button onClick={() => onLike(post.id, !liked)} className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold ${liked ? "bg-amber-400/15 text-amber-200" : "text-slate-400 hover:bg-[#272a30]"}`}><IconHeart size={14} />{data.likeCounts[post.id] ?? 0}</button><span className="inline-flex items-center gap-1 text-[10px] text-slate-400"><IconMessageCircle size={14} />{comments.length} comments</span><span className="ml-auto text-[8px] font-bold uppercase text-slate-400">{post.isDemo ? "Demo data" : "Member post"}</span></div>{comments.length > 0 && <div className="mt-3 space-y-2 border-l-2 border-amber-200 pl-3">{comments.map((comment) => <div key={comment.id}><p className="text-[10px] font-bold text-slate-400">{comment.authorName}{comment.isDemo && <span className="ml-1 font-normal text-slate-400">· demo</span>}</p><p className="mt-0.5 text-xs text-slate-400">{comment.body}</p></div>)}</div>}{canPost(selectedGroupId) && <form className="mt-3 flex gap-2" onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const body = String(new FormData(form).get("body") ?? "").trim(); if (body) { onComment(post.id, body); form.reset(); } }}><input aria-label="Add a comment" name="body" required maxLength={500} className="min-w-0 flex-1 rounded-lg border border-[#333740] bg-[#17191d] px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500" placeholder="Write a comment…" /><button aria-label="Post comment" className="rounded-lg bg-[#272a30] px-3 text-xs font-bold text-slate-300 hover:bg-[#333740]">Post</button></form>}</article>;
    })}{!data.posts.some((post) => post.groupId === selectedGroupId) && <p className="rounded-xl bg-[#1d2025] p-6 text-center text-xs text-slate-400">No posts in this group yet.</p>}</div>
    </div></div></div></div>;
}

function RoleOverview({ role, active, notify }: { role: Role; active: string; notify: (message: string) => void }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All statuses");
  const dashboards: Record<Exclude<Role, "Member">, { metrics: [string, string, string][]; chart: [string, number][]; records: { section: string; name: string; detail: string; status: string; value: string }[] }> = {
    Trainer: {
      metrics: [["Assigned clients", "18", "Sample roster"], ["Sessions this week", "24", "Sample records"], ["Follow-ups", "5", "Sample queue"], ["Plan adherence", "82%", "Illustrative"]],
      chart: [["Mon", 5], ["Tue", 3], ["Wed", 4], ["Thu", 2], ["Fri", 4], ["Sat", 6], ["Sun", 0]],
      records: [
        { section: "Clients", name: "Priya Sharma", detail: "Strength · 3 sessions this week · 88% adherence", status: "On track", value: "Review Friday" },
        { section: "Clients", name: "Rahul Mehta", detail: "Fat loss · missed Monday · 71% adherence", status: "Check in", value: "Due today" },
        { section: "Clients", name: "Aarav Singh", detail: "Beginner · 2 sessions this week · 90% adherence", status: "Plan review", value: "Due tomorrow" },
        { section: "Clients", name: "Nisha Verma", detail: "Strength · 4 sessions this week · 84% adherence", status: "On track", value: "Review Monday" },
        { section: "Clients", name: "Vikram Das", detail: "Mobility · 2 sessions this week · 76% adherence", status: "Check in", value: "Due Friday" },
        { section: "Plans", name: "Foundation Strength", detail: "3 days/week · full gym · 6-week sample plan", status: "Active", value: "9 clients" },
        { section: "Plans", name: "Progressive Upper/Lower", detail: "4 days/week · progressive overload · sample plan", status: "Active", value: "6 clients" },
        { section: "Plans", name: "Low-impact Conditioning", detail: "3 days/week · adaptable cardio and mobility", status: "Draft", value: "3 clients" },
        { section: "Plans", name: "Hypertrophy Block A", detail: "4 days/week · 8-week sample progression", status: "Active", value: "5 clients" },
        { section: "Plans", name: "Mobility Reset", detail: "2 days/week · recovery-focused sample plan", status: "Review", value: "2 clients" },
        { section: "Sessions", name: "Priya Sharma", detail: "Strength coaching · 45 minutes · sample session", status: "Completed", value: "09:00" },
        { section: "Sessions", name: "Rahul Mehta", detail: "Progress check-in · 30 minutes · sample session", status: "Notes due", value: "11:30" },
        { section: "Sessions", name: "Aarav Singh", detail: "Technique coaching · 40 minutes · sample session", status: "Upcoming", value: "16:00" },
        { section: "Sessions", name: "Nisha Verma", detail: "Strength progression · 50 minutes · sample session", status: "Upcoming", value: "17:00" },
        { section: "Sessions", name: "Vikram Das", detail: "Mobility assessment · 30 minutes · sample session", status: "Rescheduled", value: "18:15" },
        { section: "Client progress", name: "Priya Sharma", detail: "Squat estimate · sample progress record", status: "Improving", value: "+5 kg" },
        { section: "Client progress", name: "Rahul Mehta", detail: "Weekly attendance · sample progress record", status: "Review", value: "3 / 4" },
        { section: "Client progress", name: "Aarav Singh", detail: "Workout completion · sample progress record", status: "Improving", value: "90%" },
        { section: "Client progress", name: "Nisha Verma", detail: "Weekly training volume · sample progress record", status: "Improving", value: "+8%" },
        { section: "Client progress", name: "Vikram Das", detail: "Mobility check-in · sample progress record", status: "Review", value: "6 / 10" },
        { section: "Follow-ups", name: "Rahul Mehta", detail: "Confirm next training time", status: "Due today", value: "Today" },
        { section: "Follow-ups", name: "Aarav Singh", detail: "Review beginner plan progression", status: "Due soon", value: "Tomorrow" },
        { section: "Follow-ups", name: "Priya Sharma", detail: "Check recovery after lower-body session", status: "Scheduled", value: "Friday" },
        { section: "Follow-ups", name: "Nisha Verma", detail: "Confirm next block start date", status: "Scheduled", value: "Monday" },
        { section: "Follow-ups", name: "Vikram Das", detail: "Share mobility homework and check response", status: "Due soon", value: "Friday" },
        { section: "Messages", name: "Priya Sharma", detail: "Asked about adjusting session warm-ups", status: "Unread", value: "10:42" },
        { section: "Messages", name: "Rahul Mehta", detail: "Confirmed availability for a progress check-in", status: "Read", value: "Yesterday" },
        { section: "Messages", name: "Aarav Singh", detail: "Shared a form-check question before next session", status: "Unread", value: "09:18" },
      ],
    },
    "Gym Owner": {
      metrics: [["Members", "428", "Sample roster"], ["Active plans", "397", "93% sample share"], ["Monthly revenue", "₹2.14L", "Sample ledger"], ["Monthly expenses", "₹1.38L", "Sample ledger"]],
      chart: [["Mon", 62], ["Tue", 75], ["Wed", 69], ["Thu", 82], ["Fri", 71], ["Sat", 94], ["Sun", 48]],
      records: [
        { section: "Members", name: "Meera Kapoor", detail: "Premium · sample member", status: "Active", value: "Renewal Nov 12" },
        { section: "Members", name: "Kabir Nair", detail: "Basic · sample member", status: "Active", value: "Renewal Nov 19" },
        { section: "Members", name: "Sana Iyer", detail: "Premium trial · sample member", status: "Trial", value: "Renewal Nov 22" },
        { section: "Members", name: "Arjun Rao", detail: "Student quarterly · sample member", status: "Active", value: "Renewal Dec 03" },
        { section: "Members", name: "Tara Bose", detail: "Basic · sample member", status: "Past due", value: "Renewal Nov 08" },
        { section: "Trainers", name: "Riya Patel", detail: "Strength coach · 18 clients · sample record", status: "On shift", value: "24 sessions" },
        { section: "Trainers", name: "Dev Malhotra", detail: "Conditioning coach · 14 clients · sample record", status: "On shift", value: "19 sessions" },
        { section: "Trainers", name: "Anika Rao", detail: "Mobility coach · 11 clients · sample record", status: "Off shift", value: "12 sessions" },
        { section: "Trainers", name: "Karan Shah", detail: "Personal trainer · 9 clients · sample record", status: "On shift", value: "15 sessions" },
        { section: "Trainers", name: "Leena Das", detail: "Group fitness coach · 7 clients · sample record", status: "On leave", value: "8 sessions" },
        { section: "Plans", name: "Premium monthly", detail: "₹499 per month · sample plan", status: "Available", value: "244 members" },
        { section: "Plans", name: "Basic monthly", detail: "₹299 per month · sample plan", status: "Available", value: "117 members" },
        { section: "Plans", name: "Student quarterly", detail: "₹799 per quarter · sample plan", status: "Available", value: "36 members" },
        { section: "Plans", name: "Annual all-access", detail: "₹4,999 per year · sample plan", status: "Available", value: "0 members" },
        { section: "Plans", name: "Founders legacy", detail: "Archived rate · sample plan", status: "Archived", value: "12 members" },
        { section: "Subscriptions", name: "Premium renewals", detail: "Sample upcoming renewal batch", status: "Due soon", value: "18 · next 7 days" },
        { section: "Subscriptions", name: "Basic renewals", detail: "Sample upcoming renewal batch", status: "Due soon", value: "8 · next 7 days" },
        { section: "Subscriptions", name: "Trial conversions", detail: "Sample follow-up queue", status: "Follow up", value: "14 trials" },
        { section: "Subscriptions", name: "Past-due accounts", detail: "Sample payment recovery queue", status: "Needs attention", value: "6 members" },
        { section: "Subscriptions", name: "Annual renewals", detail: "Sample upcoming renewal batch", status: "Due soon", value: "5 · next 30 days" },
        { section: "Revenue", name: "Membership receipts", detail: "244 Premium, 117 Basic, 36 Student · sample ledger", status: "Income", value: "₹1,85,503" },
        { section: "Revenue", name: "Classes and PT", detail: "Sample monthly income ledger", status: "Income", value: "₹28,497" },
        { section: "Revenue", name: "Staff payroll", detail: "Sample monthly expense ledger", status: "Expense", value: "₹92,000" },
        { section: "Revenue", name: "Facility and utilities", detail: "Sample monthly expense ledger", status: "Expense", value: "₹46,000" },
        { section: "Analytics", name: "Weekly check-ins", detail: "Sample attendance aggregate", status: "Engagement", value: "1,182" },
        { section: "Analytics", name: "Class attendance", detail: "Sample sessions attended", status: "Engagement", value: "76%" },
        { section: "Analytics", name: "Member retention", detail: "Illustrative monthly estimate", status: "Engagement", value: "91%" },
        { section: "Analytics", name: "Peak check-in window", detail: "Sample attendance pattern", status: "Engagement", value: "17:00–19:00" },
        { section: "Analytics", name: "Trial conversion", detail: "Illustrative monthly estimate", status: "Engagement", value: "38%" },
        { section: "Announcements", name: "Weekend schedule", detail: "Sample gym-wide announcement", status: "Draft", value: "18:00" },
        { section: "Announcements", name: "Maintenance notice", detail: "Sample member announcement", status: "Scheduled", value: "Tomorrow" },
        { section: "Announcements", name: "Holiday hours", detail: "Sample gym-wide announcement", status: "Published", value: "Nov 01" },
        { section: "Support", name: "Equipment maintenance", detail: "Sample operations ticket", status: "Open", value: "2 days" },
        { section: "Support", name: "Membership pause request", detail: "Sample member service ticket", status: "In review", value: "Today" },
        { section: "Support", name: "Locker access", detail: "Sample facility ticket", status: "Resolved", value: "Yesterday" },
        { section: "Settings", name: "Opening hours", detail: "Sample operating schedule", status: "Configured", value: "06:00–22:00" },
        { section: "Settings", name: "Class capacity", detail: "Sample booking configuration", status: "Configured", value: "18 spots" },
      ],
    },
    "Super Admin": {
      metrics: [["Gyms", "24", "Sample directory"], ["Users", "8,420", "Sample accounts"], ["Subscriptions", "6,812", "Sample records"], ["Transactions", "₹8.6L", "Sample monthly volume"]],
      chart: [["Mon", 58], ["Tue", 64], ["Wed", 61], ["Thu", 74], ["Fri", 80], ["Sat", 92], ["Sun", 68]],
      records: [
        { section: "Gyms", name: "Northside Fitness", detail: "342 members · sample gym account", status: "Healthy", value: "342 users" },
        { section: "Gyms", name: "FITORA Studio", detail: "428 members · sample gym account", status: "Healthy", value: "428 users" },
        { section: "Gyms", name: "Urban Strength Club", detail: "218 members · sample gym account", status: "Review", value: "218 users" },
        { section: "Gyms", name: "Harbor Active", detail: "176 members · sample gym account", status: "Healthy", value: "176 users" },
        { section: "Gyms", name: "Summit Training Lab", detail: "93 members · sample gym account", status: "Pending setup", value: "93 users" },
        { section: "Users", name: "Priya Sharma", detail: "Member · Northside Fitness · sample account", status: "Active", value: "Member" },
        { section: "Users", name: "Riya Patel", detail: "Trainer · FITORA Studio · sample account", status: "Active", value: "Trainer" },
        { section: "Users", name: "Dev Malhotra", detail: "Owner · Urban Strength Club · sample account", status: "Active", value: "Owner" },
        { section: "Users", name: "Sana Iyer", detail: "Member · FITORA Studio · sample account", status: "Active", value: "Member" },
        { section: "Users", name: "Karan Shah", detail: "Trainer · Northside Fitness · sample account", status: "Invited", value: "Trainer" },
        { section: "Users", name: "Mira Sen", detail: "Owner · Harbor Active · sample account", status: "Suspended", value: "Owner" },
        { section: "Plans", name: "Premium monthly", detail: "Sample subscription plan", status: "Available", value: "₹499 / month" },
        { section: "Plans", name: "Basic monthly", detail: "Sample subscription plan", status: "Available", value: "₹299 / month" },
        { section: "Plans", name: "Annual studio", detail: "Sample subscription plan", status: "Review", value: "₹4,999 / year" },
        { section: "Plans", name: "Student quarterly", detail: "Sample subscription plan", status: "Available", value: "₹799 / quarter" },
        { section: "Plans", name: "Legacy starter", detail: "Sample archived subscription plan", status: "Archived", value: "₹199 / month" },
        { section: "Transactions", name: "TX-10482", detail: "Northside Fitness · sample subscription payment", status: "Succeeded", value: "₹499" },
        { section: "Transactions", name: "TX-10481", detail: "FITORA Studio · sample renewal", status: "Succeeded", value: "₹499" },
        { section: "Transactions", name: "TX-10480", detail: "Urban Strength Club · sample trial conversion", status: "Pending", value: "₹299" },
        { section: "Transactions", name: "TX-10479", detail: "Northside Fitness · sample annual renewal", status: "Succeeded", value: "₹4,999" },
        { section: "Transactions", name: "TX-10478", detail: "Harbor Active · sample payment retry", status: "Failed", value: "₹499" },
        { section: "Transactions", name: "TX-10477", detail: "FITORA Studio · sample refund", status: "Refunded", value: "₹299" },
        { section: "Analytics", name: "Monthly recurring revenue", detail: "Sample platform aggregate", status: "Stable", value: "₹8.6L" },
        { section: "Analytics", name: "Active subscriptions", detail: "Sample platform aggregate", status: "Growing", value: "6,812" },
        { section: "Analytics", name: "Gym retention", detail: "Illustrative platform estimate", status: "Stable", value: "94%" },
        { section: "Analytics", name: "New gym activations", detail: "Sample monthly platform aggregate", status: "Growing", value: "4 this month" },
        { section: "Analytics", name: "Payment success rate", detail: "Illustrative transaction estimate", status: "Stable", value: "97.8%" },
        { section: "Analytics", name: "Support response time", detail: "Sample platform service metric", status: "On target", value: "3.2 hours" },
        { section: "Support", name: "Billing question", detail: "Sample support case", status: "Open", value: "2 hours" },
        { section: "Support", name: "Gym account verification", detail: "Sample onboarding case", status: "In review", value: "1 day" },
        { section: "Support", name: "Subscription cancellation", detail: "Sample member case", status: "Resolved", value: "Yesterday" },
        { section: "Settings", name: "Platform health", detail: "Sample operational status", status: "Healthy", value: "99.9%" },
        { section: "Settings", name: "Payment provider", detail: "Sample integration status", status: "Connected", value: "Sandbox" },
        { section: "Settings", name: "Data retention policy", detail: "Sample platform configuration", status: "Configured", value: "365 days" },
      ],
    },
  };
  const data = dashboards[role as Exclude<Role, "Member">];
  const section = active === "Overview" ? "Overview" : active;
  const sectionRecords = data.records.filter((record) => section === "Overview" || record.section === section);
  const statuses = [...new Set(sectionRecords.map((record) => record.status))];
  const records = sectionRecords.filter((record) => (status === "All statuses" || record.status === status) && `${record.name} ${record.detail} ${record.status}`.toLowerCase().includes(search.toLowerCase()));
  const displayedRecords = records.length || search || status !== "All statuses" ? records : data.records.slice(0, 5);
  const maxValue = Math.max(...data.chart.map(([, value]) => value), 1);
  return <div className="space-y-5">
    <div className="rounded-xl border border-amber-400/20 bg-amber-400/[.06] px-4 py-3 text-xs text-amber-200">All figures, profiles, and operations below are sample data. This preview does not modify real records.</div>
    {active === "Overview" && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{data.metrics.map(([label, value, detail], index) => <MetricCard key={label} label={label} value={value} icon={index === 0 ? IconUser : index === 1 ? IconActivity : index === 2 ? IconChartBar : IconBell} detail={`Sample · ${detail}`} color={index === 1 ? "green" : index === 2 ? "violet" : "blue"} />)}</div>}
    <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
      <section className="gym-card rounded-2xl border p-5 sm:p-6"><SectionTitle title={active === "Overview" ? "Sample weekly activity" : `${active} activity`} right={<span className="text-[9px] font-bold uppercase text-amber-300">Sample chart</span>} /><div className="flex h-36 items-end gap-2">{data.chart.map(([label, value]) => <div key={label} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><div className="w-full max-w-10 rounded-t-md bg-amber-400" style={{ height: `${Math.max(5, value / maxValue * 100)}%` }} /><span className="text-[9px] text-slate-400">{label}</span></div>)}</div></section>
      <section className="gym-card rounded-2xl border p-5 sm:p-6"><SectionTitle title={active === "Overview" ? "Role dashboard" : active} right={<span className="text-[9px] font-bold uppercase text-amber-300">{role} sample data</span>} /><div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto]"><label className="sr-only" htmlFor="role-record-search">Search sample records</label><input id="role-record-search" value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-xl border border-[#333740] bg-[#17191d] px-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-500" placeholder={`Search ${active === "Overview" ? "records" : active.toLowerCase()}…`} /><label className="sr-only" htmlFor="role-status-filter">Filter sample records by status</label><select id="role-status-filter" value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-[#333740] bg-[#17191d] px-3 py-2.5 text-xs text-slate-200"><option>All statuses</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select></div><div className="space-y-2">{displayedRecords.map((record) => <article key={`${record.section}-${record.name}`} className="grid gap-2 rounded-xl bg-[#1d2025] p-3 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="text-xs font-bold text-slate-100">{record.name}</p><p className="mt-1 text-[10px] leading-4 text-slate-400">{record.detail}</p></div><div className="flex items-center justify-between gap-3 sm:justify-end"><span className="text-[10px] font-semibold text-slate-300">{record.value}</span><span className="rounded-full bg-amber-400/10 px-2 py-1 text-[9px] font-bold text-amber-300">{record.status}</span></div></article>)}{displayedRecords.length === 0 && <p className="rounded-xl bg-[#1d2025] p-5 text-center text-xs text-slate-400">No sample records match these filters.</p>}</div><button onClick={() => notify(`${active} sample data is read-only in this preview.`)} className="mt-4 rounded-lg border border-[#333740] px-3 py-2 text-[10px] font-bold text-slate-300 hover:bg-[#272a30]">Export / manage</button></section>
    </div>
  </div>;
}
