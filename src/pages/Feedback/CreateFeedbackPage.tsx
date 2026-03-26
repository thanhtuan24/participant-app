import PageLayout from "@components/layout/PageLayout";
import React, { useState, useEffect } from "react";
import { useStore } from "@store";
import { useNavigate } from "zmp-ui";
import RestrictedAccess from "@components/common/RestrictedAccess";
import CreateFeedbackSuccess from "./CreateFeedbackSuccess";
import CreateFeedbackForm from "./CreateFeedbackForm";

export interface IUploadImageResponse {
    domain: string;
    images: string[];
}

export interface FormItemValidate {
    status: "default" | "error";
    errorText?: string;
}

export interface FormValidate {
    title: FormItemValidate;
    content: FormItemValidate;
}

const CreateFeedbackPage: React.FC = () => {
    const getUser = useStore(state => state.getUserInfo);
    const [user] = useStore(state => [state.user]);
    const { enableRichFeatures, isAuthorizedMember } = useStore(state => ({
        enableRichFeatures: state.enableRichFeatures,
        isAuthorizedMember: state.isAuthorizedMember,
    }));
    const [feedbackSucess, setFeedbackSuccess] = useState<boolean>(false);

    useEffect(() => {
        (async () => {
            // eslint-disable-next-line no-unused-expressions
            !user && (await getUser());
        })();
    }, []);

    // Nếu enableRichFeatures bật và không phải member → restricted
    if (enableRichFeatures && isAuthorizedMember === false) {
        return (
            <PageLayout title="Trở về">
                <RestrictedAccess />
            </PageLayout>
        );
    }

    return (
        <PageLayout title="Trở về">
            {feedbackSucess ? (
                <CreateFeedbackSuccess />
            ) : (
                <CreateFeedbackForm
                    successCallback={result => {
                        setFeedbackSuccess(Boolean(result));
                    }}
                />
            )}
        </PageLayout>
    );
};

export default CreateFeedbackPage;
